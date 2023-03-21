const fetch = require("node-fetch").default;

const RichInventory = class RichInventory {
  constructor(steamuser) {
    this.steam64ID = steamuser.logOnResult.client_supplied_steamid;
  }

  init() {
    return new Promise((resolve, reject) => {
      this.fetchFiles().then(({ success, items, descriptions }) => {
        if (!success) {
          reject();
        }
        this.items = items;
        this.descriptions = descriptions;
        resolve();
      });
    });
  }

  getItemInfo(itemid) {
    let itemData = this.items[itemid];
    if (itemData == undefined) {
      console.log(itemid + " not found");
      return;
    }
    let classID = itemData.classid;
    let instanceID = itemData.instanceid;
    let description = this.descriptions[`${classID}_${instanceID}`];
    return description;
  }

  fetchFiles() {
    return fetch(
      `https://steamcommunity.com/profiles/${this.steam64ID}/inventory/json/730/2`
    )
      .then((data) => data.json())
      .then((data) => {
        return {
          success: data.success,
          items: data.rgInventory,
          descriptions: data.rgDescriptions,
        };
      })
      .catch((err) => {
        console.log(err);
      });
  }
};

exports.RichInventory = RichInventory;
