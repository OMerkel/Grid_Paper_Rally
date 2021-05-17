/**
 * @file hmi.js
 * @author Oliver Merkel <Merkel(dot)Oliver(at)web(dot)de>
 * @date 2021 May 8
 *
 * @section LICENSE
 *
 * Copyright 2021, Oliver Merkel <Merkel(dot)Oliver(at)web(dot)de>
 * All rights reserved.
 *
 * Released under the MIT license.
 *
 * @section DESCRIPTION
 *
 * @brief Class Hmi.
 *
 * Class representing the view or Hmi of Grid Paper Rally.
 * Grid Paper Rally is a turn based racing game.
 *
 */

const map = {
  waypoints: "1234*",
  map: [
    '#################',
    '####           ##',
    '#  1            #',
    '#  11           #',
    '#   11          #',
    '#    1######    #',
    '#    ########333#',
    '#    ##    ##333#',
    '#   ###4444##   #',
    '#   ##44444##   #',
    '#   ##     ##   #',
    '#   ##     ##   #',
    '#   ###    ##   #',
    '#   ##     ##   #',
    '#   ###    ##   #',
    '#   ####    ##  #',
    '#   ####    ##  #',
    '#    ###    #   #',
    '#          ##   #',
    '#          #    #',
    '##         2    #',
    '##        22    #',
    '###       2    ##',
    '#################',
  ]
};

function Racer() {
  this.position = { x: 8, y: 11 };
  this.velocity = { x: 0, y: 0 };
  this.predictedTrack = [];
  this.damage = 0;
}

Racer.prototype.bresenham = function() {
  var track = [];
  var p, d;
  var sgn = {
    x: Math.sign(this.velocity.x),
    y: Math.sign(this.velocity.y)
  };
  if (Math.abs(this.velocity.x) > Math.abs(this.velocity.y)) {
    p = { x: sgn.x, y: 0 };
    d = { x: sgn.x, y: sgn.y };
    delta = {
      fine: Math.abs(this.velocity.x),
      coarse: Math.abs(this.velocity.y)
    };
  }
  else {
    p = { x: 0, y: sgn.y };
    d = { x: sgn.x, y: sgn.y };
    delta = {
      fine: Math.abs(this.velocity.y),
      coarse: Math.abs(this.velocity.x)
    };
  }
  var pos = { x: this.position.x, y: this.position.y };
  var err = delta.fine / 2;
  for( var a=0; a<delta.fine; ++a ) {
    err -= delta.coarse;
    if (err<0) {
      pos.x += d.x;
      pos.y += d.y;
      err += delta.fine;
    }
    else {
      pos.x += p.x;
      pos.y += p.y;
    }
    track.push( { x: pos.x, y: pos.y } );
  }
  return track;
};

Racer.prototype.accelerate = function ( acceleration ) {
  this.velocity = {
    x: this.velocity.x + acceleration.x,
    y: this.velocity.y + acceleration.y
  };
};

Racer.prototype.drive = function ( nextPosition ) {
  if (
    Math.abs(nextPosition.x - this.position.x) < 2 &&
    Math.abs(nextPosition.y - this.position.y) < 2 ) {
    this.position = {
      x: nextPosition.x,
      y: nextPosition.y
    };
  }
};

Racer.prototype.getPathPrediction = function ( ) {
  this.predictedTrack = this.bresenham();
  return this.predictedTrack;
};

function Hmi() {
  this.grid = {
    size: { x: map.map[0].length, y: map.map.length },
    map: [],
  };
  this.field = { size: 20 };
  this.racer = new Racer();
  this.panel = {
    x: this.grid.size.x * this.field.size,
    y: this.grid.size.y * this.field.size
  };
  this.paper = Raphael( 'board', this.panel.x, this.panel.y);
  this.paper.setViewBox(0, 0, this.panel.x, this.panel.y, false );
  this.resize();
  this.paper.rect( 0, 0, this.panel.x, this.panel.y ).attr({
    stroke: '#444', 'stroke-width': 0.2, 'stroke-linecap': 'round',
    fill: 'darkslategrey'
  });
  for(var y=0; y<this.grid.size.y; ++y) {
    this.grid.map[y] = [];
    for(var x=0; x<this.grid.size.x; ++x) {
      this.grid.map[y][x] = {
        back: this.paper.rect( this.field.size*x, this.field.size*y,
          this.field.size, this.field.size )
          .attr({ 'fill': 'blue', stroke: 'none',
            'stroke-width': 1 }),
        label: this.paper.text( this.field.size*x+this.field.size/2,
          this.field.size*y+this.field.size/2, ' ')
          .attr({ fill: 'lightblue', 'font-size': this.field.size }),
        marker: this.paper.path(
          'M' + (this.field.size*x+this.field.size/2) + 
          ',' + (this.field.size*y+this.field.size/2) +
          'm-' + this.field.size / 4 +
          ',0l' + this.field.size / 2 +
          ',0m-' + this.field.size / 4 +
          ',-' + this.field.size / 4 +
          'l0,' + this.field.size / 2 )
          .attr({ 'fill': 'none', stroke: 'darkblue', 'stroke-width': 1 }),
        racer: this.paper.circle(
          this.field.size*x+this.field.size/2,
          this.field.size*y+this.field.size/2, 5 )
          .attr({ 'fill': 'none', stroke: 'yellow', 'stroke-width': 1,
            opacity: 0 }),
        button: this.paper.rect( this.field.size*x, this.field.size*y,
          this.field.size, this.field.size )
          .attr({ 'fill': 'white', stroke: 'none',
            'stroke-width': 1 , 'fill-opacity': 0.01 }),
      }
      this.grid.map[y][x].button.click( this.handler.bind(this) );
    }
  }
  this.velocity = {
    arrow: this.paper.path( 'M100,100l0,0' )
      .attr({ 'fill': 'none', stroke: 'yellow', 'stroke-width': 1 }),
  };
  this.update();
/*
  this.img = new Image();
  this.img.crossOrigin = 'anonymous';
  this.img.src = 'img/icons/hangman256.png';
  this.img.onload = e => res(img);
  // this.img.onerror = rej;
*/
/*
  var offscreen = new OffscreenCanvas(256, 256);
  var gl = offscreen.getContext('webgl');
  const imageData = new ImageData(
    new Uint8ClampedArray(
      new PNG(new Uint8Array(await (await offscreen.toBlob({type: "image/png"})).arrayBuffer())).decodePixels()
    )
  , offscreen.width, offscreen.height);
*/
  // console.log('image loaded');
};

Hmi.prototype.handler = function ( ev ) {
  var pos = null;
  for(var y=0; y<this.grid.size.y && pos==null; ++y) {
    for(var x=0; x<this.grid.size.x && pos==null; ++x) {
      if (this.grid.map[y][x].button.id == ev.currentTarget.raphaelid) {
        pos = { x: x, y: y };
      }
    }
  }
  var rv = {
    x: this.racer.position.x + this.racer.velocity.x,
    y: this.racer.position.y + this.racer.velocity.y
  };
  if ( pos.x >= rv.x-1 && pos.x <= rv.x+1 &&
       pos.y >= rv.y-1 && pos.y <= rv.y+1 ) {
    var acceleration = {
      x: pos.x-this.racer.position.x-this.racer.velocity.x,
      y: pos.y-this.racer.position.y-this.racer.velocity.y
    };
    var delayedAcceleration = $('#delayed').is(':checked');
    if (!delayedAcceleration) {
      this.racer.accelerate( acceleration );
    }
    var track = this.racer.getPathPrediction();
    for( var posIdx in track ) {
      var pos = track[posIdx]
      if ( map.map[pos.y][pos.x] == '#' ) {
        this.grid.map[pos.y][pos.x].back.attr({ 'fill': 'darkgreen' });
        ++this.racer.damage;
        console.log('racer damage: ' + this.racer.damage);
        break;
      }
      this.racer.drive( pos );
      this.updateWaypointIndex( pos );
      this.update();
    }
    if (delayedAcceleration) {
      this.racer.accelerate( acceleration );
    }
    this.update();
  }
};

Hmi.prototype.resize = function () {
  var offsetHeight = 64,
    availableWidth = window.innerWidth - 24,
    availableHeight = window.innerHeight - offsetHeight;
  this.size = availableWidth/availableHeight < this.panel.x/this.panel.y ?
    { x: availableWidth, y: availableWidth * this.panel.y/this.panel.x } :
    { x: availableHeight * this.panel.x/this.panel.y, y: availableHeight } ;
  this.paper.setSize( this.size.x, this.size.y );
  this.paper.setViewBox( 0, 0, this.panel.x, this.panel.y, false );
  var boardMarginTop = (availableHeight - this.size.y) / 2;
  $('#board').css({ 'margin-top': boardMarginTop + 'px' });
  $('#selectmenu').css({ 'margin-top': boardMarginTop + 'px' });
  $('#game-page').css({
    'background-size': 'auto ' + (this.size.x * 9 / 6) + 'px',
  });
  var size = (this.size.x + this.size.y) / 2 / 9;
  var minSize = 60;
  var iconSize = size < minSize ? minSize : size;
  var maxSize = 120;
  iconSize = maxSize < iconSize ? maxSize : iconSize;
  $('#customMenu').css({
    'width': iconSize+'px', 'height': iconSize+'px',
    'background-size': iconSize+'px ' + iconSize+'px',
  });
  var backAttributes = {
    'width': iconSize+'px', 'height': iconSize+'px',
    'background-size': iconSize+'px ' + iconSize+'px',
  };
  $('#customBackRules').css(backAttributes);
  $('#customBackAbout').css(backAttributes);
};

Hmi.prototype.initGame = function () {
  this.nextWaypointIndex = 0;
  for(var y=0; y<this.grid.size.y; ++y) {
    for(var x=0; x<this.grid.size.x; ++x) {
      var color = 'blue';
      if (map.map[y][x]=='#') {
        color = 'green';
      }
      this.grid.map[y][x].back.attr({ fill: color });
      if ('1234'.includes(map.map[y][x])) {
        this.grid.map[y][x].label.attr({ text: map.map[y][x] });
      }
    }
  }    
  this.update();
  $('#left-panel').panel('close');
};

Hmi.prototype.init = function () {
  this.initGame();
  var $window = $(window);
  window.addEventListener("orientationchange", this.resize.bind( this ));
  $window.resize( this.resize.bind( this ) );
  $window.resize();
  this.update();
  $('#restart').on( 'click', this.initGame.bind(this) );
};

Hmi.prototype.update = function() {
  for(var y=0; y<this.grid.size.y; ++y) {
    for(var x=0; x<this.grid.size.x; ++x) {
      if (x == this.racer.position.x && y == this.racer.position.y) {
        this.grid.map[y][x].racer
          .attr({ fill: 'orange', opacity: 1 });
      }
      else {
        this.grid.map[y][x].racer
          .attr({ opacity: 0 });
      }
      var rv = {
        x: this.racer.position.x + this.racer.velocity.x,
        y: this.racer.position.y + this.racer.velocity.y
      };
      if ( x < rv.x-1 || x > rv.x+1 || y < rv.y-1 || y > rv.y+1 ) {
        this.grid.map[y][x].marker
          .attr({ opacity: 0 });
      }
      else {
        this.grid.map[y][x].marker
          .attr({ opacity: 1 });
      }
    }
  }
  this.velocity.arrow.attr({
    path: 'M' + (this.field.size*this.racer.position.x+this.field.size/2) + 
          ',' + (this.field.size*this.racer.position.y+this.field.size/2) +
          'l' + (this.field.size*this.racer.velocity.x) +
          ',' + (this.field.size*this.racer.velocity.y),
  });
  $('#myheader').html( "Grid Paper Rally - next waypoint: " +
    map.waypoints[this.nextWaypointIndex] );
};

Hmi.prototype.updateWaypointIndex = function( pos ) {
  var label = this.grid.map[pos.y][pos.x].label.attr('text');
  if ( map.waypoints[this.nextWaypointIndex] == label &&
   this.nextWaypointIndex < map.waypoints.length-1 ) {
    ++this.nextWaypointIndex;
  }
};

var g_Hmi;
$(document).ready( function () {
  g_Hmi = new Hmi();
  g_Hmi.init();
});
