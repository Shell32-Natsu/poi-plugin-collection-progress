"use strict";

var _dec, _class;

const React = require("react");

const {
  createRef
} = require("react");

const {
  Provider,
  connect
} = require("react-redux");

const {
  store
} = require("views/create-store");

const i18next = require("views/env-parts/i18next");

const html2canvas = require("html2canvas");

const {
  remote
} = require("electron");

i18next.setDefaultNamespace("poi-plugin-collection-progress"); // Magic from https://github.com/poooi/plugin-navy-album/blob/master/game-misc/magic.es

const createCypherNum = (id, seed) => {
  const resource = [6657, 5699, 3371, 8909, 7719, 6229, 5449, 8561, 2987, 5501, 3127, 9319, 4365, 9811, 9927, 2423, 3439, 1865, 5925, 4409, 5509, 1517, 9695, 9255, 5325, 3691, 5519, 6949, 5607, 9539, 4133, 7795, 5465, 2659, 6381, 6875, 4019, 9195, 5645, 2887, 1213, 1815, 8671, 3015, 3147, 2991, 7977, 7045, 1619, 7909, 4451, 6573, 4545, 8251, 5983, 2849, 7249, 7449, 9477, 5963, 2711, 9019, 7375, 2201, 5631, 4893, 7653, 3719, 8819, 5839, 1853, 9843, 9119, 7023, 5681, 2345, 9873, 6349, 9315, 3795, 9737, 4633, 4173, 7549, 7171, 6147, 4723, 5039, 2723, 7815, 6201, 5999, 5339, 4431, 2911, 4435, 3611, 4423, 9517, 3243];

  const createKey = t => {
    let e = 0;

    if (t !== null && t !== '') {
      for (let i = 0; i < t.length; i++) {
        e += t.charCodeAt(i);
      }
    }

    return e;
  };

  const o = id.toString().match(/\d+/);
  if (o === null || o.length === 0) return '';
  const r = parseInt(o[0], 10);
  const s = createKey(seed);
  const a = seed == null || seed.length === 0 ? 1 : seed.length;
  return (17 * (r + 7) * resource[(s + r * a) % 100] % 8973 + 1e3).toString();
};

class UnionFindSet {
  constructor(allShips) {
    this.nodeMap = new Map();
    this.allShips = allShips;

    for (const id in allShips) {
      if (!("api_aftershipid" in allShips[id])) continue;
      this.add(id, allShips[id]["api_aftershipid"]);
    }
  }

  newNode(v) {
    return {
      id: v,
      head: v
    };
  }

  head(v) {
    let node = this.nodeMap.get(v);

    while (node.head !== node.id) node = this.nodeMap.get(node.head);

    return node.id;
  }

  add(_v1, _v2) {
    const v1 = Math.min(_v1, _v2);
    const v2 = Math.max(_v1, _v2);

    if (v1 === 0) {
      if (!this.nodeMap.has(v2)) this.nodeMap.set(v2, this.newNode(v2));
      return;
    }

    if (!this.nodeMap.has(v1)) this.nodeMap.set(v1, this.newNode(v1));
    if (!this.nodeMap.has(v2)) this.nodeMap.set(v2, this.newNode(v2));
    let h1 = this.head(v1);
    let h2 = this.head(v2);

    if (this.allShips[h1]["api_afterlv"] > this.allShips[h2]["api_afterlv"] && this.allShips[h2]["api_afterlv"] != 0 || this.allShips[h1]["api_afterlv"] == 0) {
      const t = h1;
      h1 = h2;
      h2 = t;
    }

    if (h1 !== h2) this.nodeMap.set(h2, {
      id: h2,
      head: h1
    });
  }

  allHeads() {
    const res = [];

    for (let key of this.nodeMap.keys()) {
      if (key === this.head(key)) res.push(key);
    }

    return res;
  }

}

let ShipCollectionProgress = (_dec = connect(state => ({
  ownedShips: state.info.ships || {},
  allShips: state.const.$ships || {},
  allConst: state.const || {},
  server: state.info.server || {}
})), _dec(_class = class ShipCollectionProgress extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      "showMarriedShip": false
    };
  }

  getShipMaxLevel(id) {
    let res = 0;
    Object.entries(this.ownedShips).map(ownedShip => {
      if (this.allShipSet.head(id) !== this.allShipSet.head(ownedShip[1].api_ship_id)) return;
      res = Math.max(res, Number(ownedShip[1]["api_lv"]));
    });
    return res;
  }

  getCollectProgress() {
    // Get unique owned ships
    const ownedShipsUnique = new Set();
    Object.entries(this.ownedShips).map(ownedShip => {
      let id = ownedShip[1].api_ship_id;
      ownedShipsUnique.add(this.allShipSet.head(id));
    }); // traverse all unique ships

    const allShipsUnique = this.allShipSet.allHeads();
    const shipTypeProgress = {};
    const shipTypeShipCount = {};
    allShipsUnique.map(id => {
      let shipTypeId = this.allShips[id]["api_stype"]; // Both type 8 and 9 are battleship

      if (shipTypeId === 9) shipTypeId = 8;

      if (!(shipTypeId in shipTypeProgress)) {
        shipTypeProgress[shipTypeId] = [];
        shipTypeShipCount[shipTypeId] = {
          "total": 0,
          "owned": 0
        };
      }

      shipTypeProgress[shipTypeId].push({
        "ship_id": id,
        "ship_name": this.allShips[id]["api_name"],
        "ship_type_id": shipTypeId,
        "ship_type_name": this.allConst["$shipTypes"][shipTypeId]["api_name"],
        "owned": ownedShipsUnique.has(id),
        "ship_level": this.getShipMaxLevel(id)
      });
      shipTypeShipCount[shipTypeId]["total"]++;
      if (ownedShipsUnique.has(id)) shipTypeShipCount[shipTypeId]["owned"]++;
    });
    return [shipTypeProgress, shipTypeShipCount];
  }

  getShipBannerUrl(id, server) {
    return `http://${server["ip"]}/kcs2/resources/ship/banner/${String(id).padStart(4, "0")}_${createCypherNum(id, "ship_banner")}.png`;
  }

  getShipProgressList(shipProgress) {
    return shipProgress.map(item => {
      const imageUrl = this.getShipBannerUrl(item["ship_id"], this.server);
      let className = "plugin-progress-ship-avatar";
      if (item["ship_level"] >= 100 && this.state.showMarriedShip) className += " plugin-progress-ship-married";
      let placeHolderClassName = item["owned"] ? "" : "plugin-progress-not-owned";
      return React.createElement("li", null, React.createElement("div", {
        className: className,
        style: {
          backgroundImage: `url('${imageUrl}')`
        },
        title: `${item["ship_name"]} LV${item["ship_level"]}`
      }, React.createElement("div", {
        className: placeHolderClassName
      })));
    });
  }

  createShowMarriedShipCheckBox() {
    const handleChange = () => {
      this.setState({
        "showMarriedShip": !this.state.showMarriedShip
      });
    };

    return React.createElement("label", null, React.createElement("input", {
      type: "checkbox",
      checked: this.state.showMarriedShip,
      onChange: handleChange
    }), React.createElement("span", null, i18next.t("Show married ships")));
  }

  createScreenShotButton() {
    const onStartCapture = async () => {
      if (!this.captureSection.current) return;
      const dom = this.captureSection.current;
      const {
        width,
        height
      } = dom.getBoundingClientRect();
      let canvas;

      try {
        canvas = await html2canvas(dom, {
          allowTaint: true,
          backgroundColor: '#333',
          height: _.ceil(height, 16),
          width: _.ceil(width, 16)
        });
      } catch (e) {
        console.error(e);
        return;
      }

      const dataUrl = canvas.toDataURL('image/png');
      remote.getCurrentWebContents().downloadURL(dataUrl);
    };

    return React.createElement("button", {
      onClick: onStartCapture,
      className: "capture-button"
    }, i18next.t("Save as image"));
  }

  render() {
    this.allConst = this.props.allConst;
    this.server = this.props.server;
    this.allShips = this.props.allShips;
    this.allShipSet = new UnionFindSet(this.allShips);
    this.ownedShips = this.props.ownedShips;
    this.captureSection = createRef();
    const [progress, shipNumByType] = this.getCollectProgress();
    return React.createElement("div", {
      className: "plugin-progress-main"
    }, React.createElement("div", null, this.createShowMarriedShipCheckBox(), this.createScreenShotButton()), React.createElement("div", {
      ref: this.captureSection
    }, React.createElement("h1", null, i18next.t("Collection Progress")), Object.keys(progress).map(shipTypeId => {
      return React.createElement("div", null, React.createElement("h3", {
        className: "plugin-progress-sub-title"
      }, this.allConst["$shipTypes"][shipTypeId]["api_name"], "\xA0", React.createElement("span", null, "(", shipNumByType[shipTypeId]["owned"], "/", shipNumByType[shipTypeId]["total"], ")")), React.createElement("ul", null, this.getShipProgressList(progress[shipTypeId])));
    })));
  }

}) || _class);

module.exports.reactClass = () => {
  return React.createElement(Provider, {
    store: store
  }, React.createElement("link", {
    rel: "stylesheet",
    href: [__dirname, "..", "assets", "collection-progress.css"].join("/")
  }), React.createElement(ShipCollectionProgress, {
    id: "plugin-collection-progress"
  }));
};