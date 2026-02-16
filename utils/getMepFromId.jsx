const allMeps = require("../data/meps-all.json");

const getMepFromId = (id) => {
  const foundMepsArray = allMeps.filter((mep) => {
    return mep.id == id;
  });

  return foundMepsArray[0];
};

export default getMepFromId;
