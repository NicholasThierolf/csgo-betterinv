let prices = new Prices();
const { ItemNames } = require("./item-names.js");
let itemNames = new ItemNames();

const Inventory = class Inventory {
  constructor() {}

  format(inventory) {
    let defIndexList = {};

    inventory.forEach((item) => {
      let name = itemNames.nameItem(item);
      if (name in defIndexList) {
        defIndexList[name] = {
          name,
          uniques: [{ id: item.id, containerID: item.casket_id }],
          price: prices.getItemPrice(name),
        };
      } else {
        defIndexList[name].uniques.push({
          id: item.id,
          containerID: item.casket_id,
        });
      }
    });
  }
};

exports.Inventory = Inventory;
