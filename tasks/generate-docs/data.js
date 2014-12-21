var copy = require('./utils').copy;
var yuidoc = require('./yuidoc');


function Klass(name){
  this.name = name;
  if (yuidoc.classes[name]) {
    this.yuidocData = yuidoc.classes[name];
  } else {
    // throw("no data for " + name + " in data")
    this.yuidocData = {};
  }
}

Klass.prototype = {
  items: function(){
    if (this.hasOwnProperty('_items')) { return this._items; }

    // poor man's Set.
    var itemsKeyedByName = {};

    var parents = [this.extends()];
    parents = parents.concat(this.uses());
    parents = parents.filter(function(i) { return !!i; }); // removes nulls

    // walk up the parent/uses tree and get the full
    // list of all "items" avaiable in this object type,
    // noting where the item originated.
    parents.forEach(function(parent){
      parent.items().forEach(function(item){
        var itemCopy = copy(item);
        itemCopy.inheritedFrom = itemCopy.inheritedFrom || parent.name;
        itemsKeyedByName[itemCopy.name] = itemCopy;
      });
    });

    // loop through every class item in the entire library looking for
    // items for only this class, adding them to the collection of
    // items keyed by name
    yuidoc['classitems'].forEach(function(classItem){
      if(classItem['class'] === this.name) {
        itemsKeyedByName[classItem.name] = copy(classItem);
      }
    }, this);

    this._items = Object.keys(itemsKeyedByName).map(function(key){ return itemsKeyedByName[key]; });
    return this._items;
  },
  extends: function(){
    if (this.hasOwnProperty('_extends')) { return this._extends; }

    var extended = this.yuidocData['extends'];

    if (extended && yuidoc['classes'][this.name]) {
      this._extends = Klass.find(extended);
    } else {
      this._extends = null;
    }

    return this._extends;
  },
  uses: function(){
    if (this.hasOwnProperty('_uses')) { return this._uses; }

    var uses = this.yuidocData['uses'] || [];

    this._uses = uses.map(function (use){return Klass.find(use)});
    return this._uses;
  }
}



/*
  cache the transforms from YUIDoc format to the format we use
  for docs.
*/
Klass.classes = {};

/*
  Create (and cache) a transformed class or return an already
  cached class object
*/
Klass.find = function(name){
  var klass = Klass.classes[name] || new Klass(name);
  Klass.classes[name] = klass;
  return klass;
}

module.exports = Klass;