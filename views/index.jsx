"use strict";

const React = require("react");
const { Provider, connect } = require("react-redux");
const { store } = require('views/create-store')

class UnionFindSet {
  constructor(allShips) {
    this.nodeMap = new Map();
    this.allShips = allShips;
  }

  newNode (v) {
    return {
      id: v,
      head: v
    };
  }

  head (v) {
    let node = this.nodeMap.get(v);
    while (node.head !== node.id)
      node = this.nodeMap.get(node.head);
    return node.id;
  }

  add (_v1, _v2) {
    const v1 = Math.min(_v1, _v2);
    const v2 = Math.max(_v1, _v2);
    if (v1 === 0) {
      if (!this.nodeMap.has(v2))
        this.nodeMap.set(v2, this.newNode(v2));
      return;
    }
    if (!this.nodeMap.has(v1))
      this.nodeMap.set(v1, this.newNode(v1));
    if (!this.nodeMap.has(v2))
      this.nodeMap.set(v2, this.newNode(v2));
    let h1 = this.head(v1);
    let h2 = this.head(v2);
    if ((this.allShips[h1]["api_afterlv"] > this.allShips[h2]["api_afterlv"]
      && this.allShips[h2]["api_afterlv"] != 0) ||
      (this.allShips[h1]["api_afterlv"] == 0)) {
      const t = h1;
      h1 = h2;
      h2 = t;
    }
    if (h1 !== h2)
      this.nodeMap.set(h2, {
        id: h2,
        head: h1
      });
  }
}

@connect(
  state => ({
    ownedShips: state.info.ships || {},
    allShips: state.const.$ships || {}
  })
)
class ShipNames extends React.Component {
  getOwnedShipUniqueList (ownedShips, allShips) {
    const unionFindSet = new UnionFindSet(allShips);
    for (const id in allShips) {
      if (!("api_aftershipid" in allShips[id]))
        continue;
      unionFindSet.add(id, allShips[id]["api_aftershipid"]);
    }
    const res = new Set();
    Object.entries(ownedShips).map(ownedShip => {
      let id = ownedShip[1].api_ship_id;
      res.add(unionFindSet.head(id));
    });
    return Array.from(res);
  };


  render() {
    const { ownedShips, allShips } = this.props;
    const ownedShipsUnique = this.getOwnedShipUniqueList(ownedShips, allShips);
    console.log(ownedShipsUnique.map(id => {
      return allShips[id]["api_name"];
    }));
    
    return (
      <div>
      </div>
    )
  }
}

module.exports.reactClass = () => (
  <Provider store={store}>
    <ShipNames />
  </Provider>
);