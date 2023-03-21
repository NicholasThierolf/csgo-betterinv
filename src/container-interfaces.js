/* eslint-disable */
const EventEmitter = require("events");
const GlobalOffensive = require("globaloffensive");

const Loader = class Loader extends EventEmitter {
  constructor(csgo, containers) {
    super();
    this.csgo = csgo;
    //deprecated
    /*
    this.queue = [];
    this.currentContainer;
    this.totalRequestedItems = 0;
    this.loading = false;*/
    this.containers = [];
    containers.forEach((container) => this.addContainer(container));
    //deprecated
    /*
    csgo.on("itemCustomizationNotification", (itemIds, notificationType) => {
      console.log("GOT NOTIFICATION!");
      if (
        notificationType ==
          GlobalOffensive.ItemCustomizationNotification.CasketAdded ||
        notificationType ==
          GlobalOffensive.ItemCustomizationNotification.CasketRemoved
      ) {
        console.log("got here", itemIds, this.currentContainer);
        itemIds.forEach((id) => {
          if (id == this.currentContainer) {
            console.log("got here 2");
            if (this.queue.length == 0) {
              this.loading = false;
              this.emit("finished");
              return;
            }
            this._moveItem(this.queue.shift());
            this.emit("moved", this.queue.length);
            return;
          }
        });
      }
    });*/
  }

  move(items, updateCB) {
    return new Promise(async (resolve, reject) => {
      for (let i = 0; i < items.length; i++) {
        await this.moveOne(items[i]);
        if (updateCB) updateCB(i);
      }
      resolve();
    });
  }

  async moveOne(item) {
    let promise = new Promise((resolve) => {
      let neededNotification;
      if (!item.inContainer) {
        let container = this.freestContainer();
        this.csgo.addToCasket(container.id, item.id);
        this.updateContainerAmount(container.id, 1);
        neededNotification =
          GlobalOffensive.ItemCustomizationNotification.CasketAdded;
      } else {
        this.csgo.removeFromCasket(item.containerID, item.id);
        this.updateContainerAmount(item.containerID, -1);
        neededNotification =
          GlobalOffensive.ItemCustomizationNotification.CasketRemoved;
      }
      this.csgo.once(
        "itemCustomizationNotification",
        (itemIds, notificationType) => {
          if (notificationType == neededNotification) {
            resolve();
          }
        }
      );
    });

    let timeout = new Promise((resolve) => {
      setTimeout(resolve, 10000);
    });

    return Promise.race([promise, timeout]);
  }

  addContainer(container) {
    this.containers.push({
      items: container.casket_contained_item_count,
      name: container.custom_name,
      id: container.id,
    });
  }

  freestContainer() {
    return this.containers.reduce((prev, curr) => {
      return prev.items < curr.items ? prev : curr;
    });
  }
  //deprecated
  /*
  direction() {
    return {
      load: 0,
      unload: 1,
    };
  }
  
  //do not call from outside, would ideally be private
  _moveItem(item) {
    console.log("moving item!", this.containers);
    console.log("item:", item);
    if (item.containerID === undefined) {
      let container = this.freestContainer();
      console.log("moving into", container.id);
      this.currentContainer = container.id;
      this.csgo.addToCasket(container.id, item.id);
      this.updateContainerAmount(container.id, 1);
      console.log(`containeramount After: ${container.items}`);
    } else {
      this.currentContainer = item.containerID;
      console.log("moving out of", item.containerID, this.csgo);
      this.csgo.removeFromCasket(item.containerID, item.id);
      this.updateContainerAmount(item.containerID, -1);
      console.log(
        `containeramount after: `,
        JSON.parse(JSON.stringify(this.containers))
      );
    }
    console.log(this.containers);
  }

  move(items) {
    console.log("moving", items, JSON.parse(JSON.stringify(this.queue)));
    this.totalRequestedItems = items.length;
    items.forEach((item) => {
      this.queue.push(item);
    });
    this._moveItem(this.queue.shift());
  }*/

  updateContainerAmount(containerID, amount) {
    for (let i = 0; i < this.containers.length; i++) {
      if (this.containers[i].id == containerID) {
        this.containers[i].items += amount;
        return;
      }
    }
  }
};

exports.Loader = Loader;
/* eslint-enable */
