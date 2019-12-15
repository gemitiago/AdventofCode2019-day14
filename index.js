const fs = require('fs');
let input = fs.readFileSync('./input.txt').toString();

const parseInput = input => {
  //'9 GSLTP, 15 PHNC => 5 SFZTF'
  //{in:[{amount:9, chemical:GSLTP}, {amount:15, chemical:PHNC}], out:{amount:5, chemical:SFZTF}}
  const auxInput=input.split('').map(i=>i.replace('\r','')).join('');

  return auxInput.split('\n').map(i => {
    const inOutArray = i.split(' => ');
    const outArray = inOutArray[1].split(' ');
    let inArray = inOutArray[0].split(', ');
    inArray = inArray.map(i => i.split(' '));
    //[[9, GSLTP], [15, PHNC]]
    inArray = inArray.map(i => {
      return { amount: Number(i[0]), chemical: i[1], excess: 0 };
    });

    return { inp: inArray, out: { amount: Number(outArray[0]), chemical: outArray[1] } };
  });
};

const isChemicalInList = (inp, listSimpleChemicals) => {
  const strListSimpleChemicals = listSimpleChemicals.map(obj => JSON.stringify(obj));

  return strListSimpleChemicals.toString().includes('"' + inp.chemical + '"');
};

const getReaction = (inp, reactions) => {
  return reactions.filter(reaction => reaction.out.chemical === inp.chemical)[0];
};

const roundDecimalPlaces = (num, decimalPlaces) => {
  const x = Number('1'.padEnd(decimalPlaces + 1, '0'));
  return Math.round(num * x) / x;
};

const reduceToSimpleChemicals = (inp, reactions, listSimpleChemicals, isPrecise = false) => {
  let list = [];

  if (isChemicalInList(inp, listSimpleChemicals)) {
    return list.concat(inp);
  } else {
    const reaction = getReaction(inp, reactions);

    for (const inpReaction of reaction.inp) {
      let amount = inp.amount;

      if (!isPrecise) {
        if (amount % reaction.out.amount === 0) {
          amount = amount / reaction.out.amount;
        } else {
          let leftovers = 1;
          let need = roundDecimalPlaces(amount / reaction.out.amount - Math.floor(amount / reaction.out.amount), 3);

          if (inpReaction.excess >= need) {
            inpReaction.excess -= need;
            leftovers = 0;
          } else if (inpReaction.excess < need) {
            inpReaction.excess += 1 - need;
            leftovers = 1;
          }

          amount = Math.floor(amount / reaction.out.amount) + leftovers;
        }
      } else {
        amount = amount / reaction.out.amount;
      }

      const newInpReaction = { ...inpReaction };
      newInpReaction.amount = inpReaction.amount * amount;

      //console.log(newInpReaction, 'in:' + amount, 'out:' + reaction.out.amount, 'in:' + inpReaction.amount);
      list = list.concat(reduceToSimpleChemicals(newInpReaction, reactions, listSimpleChemicals, isPrecise));
    }
  }

  return list;
};

const getCountChemicalsInp = (_chemical, reactions) => {
  let count = 0;

  for (const reaction of reactions) {
    if (reaction.chemical === _chemical) count += reaction.amount;
  }
  return count;
};

const minOreProduceFuel = (input, isPrecise = false) => {
  const reactions = parseInput(input);
  const fuel = reactions.filter(reaction => reaction.out.chemical === 'FUEL')[0];
  const listSimpleChemicals = reactions.filter(
    reaction => reaction.inp[0].chemical === 'ORE' && reaction.inp.length === 1
  );
  let list = [];

  for (const inp of fuel.inp) {
    let auxList = [];

    if (isChemicalInList(inp, listSimpleChemicals)) {
      //console.log(inp, 'in:' + inp.amount);
      auxList.push(inp);
    } else {
      auxList = reduceToSimpleChemicals(inp, reactions, listSimpleChemicals, isPrecise);
    }

    list = list.concat(auxList);
  }

  let countOres = 0;

  for (const reaction of listSimpleChemicals) {
    const amount = getCountChemicalsInp(reaction.out.chemical, list);

    if (amount % reaction.out.amount === 0 || isPrecise) {
      countOres += reaction.inp[0].amount * (amount / reaction.out.amount);
    } else {
      countOres += (Math.floor(amount / reaction.out.amount) + 1) * reaction.inp[0].amount;
    }
  }

  return { count: countOres, listSimpleChemicals: list };
};

const maxFuel = (input, numOres) => {
  let fuel = 0;
  const oresFor1Fuel = minOreProduceFuel(input, true).count;

  while (true) {
    const auxNumOres = numOres - oresFor1Fuel;

    if (auxNumOres > 0) {
      numOres -= oresFor1Fuel;
    } else {
      break;
    }

    fuel++;
  }

  return fuel;
};

const test1 =
  '10 ORE => 10 A\r\n1 ORE => 1 B\r\n7 A, 1 B => 1 C\r\n7 A, 1 C => 1 D\r\n7 A, 1 D => 1 E\r\n7 A, 1 E => 1 FUEL';

const test2 =
  '9 ORE => 2 A\r\n8 ORE => 3 B\r\n7 ORE => 5 C\r\n3 A, 4 B => 1 AB\r\n5 B, 7 C => 1 BC\r\n4 C, 1 A => 1 CA\r\n2 AB, 3 BC, 4 CA => 1 FUEL';

const test3 =
  '157 ORE => 5 NZVS\r\n165 ORE => 6 DCFZ\r\n44 XJWVT, 5 KHKGT, 1 QDVJ, 29 NZVS, 9 GPVTF, 48 HKGWZ => 1 FUEL\r\n12 HKGWZ, 1 GPVTF, 8 PSHF => 9 QDVJ\r\n179 ORE => 7 PSHF\r\n177 ORE => 5 HKGWZ\r\n7 DCFZ, 7 PSHF => 2 XJWVT\r\n165 ORE => 2 GPVTF\r\n3 DCFZ, 7 NZVS, 5 HKGWZ, 10 PSHF => 8 KHKGT';

const test4 =
  '2 VPVL, 7 FWMGM, 2 CXFTF, 11 MNCFX => 1 STKFG\r\n17 NVRVD, 3 JNWZP => 8 VPVL\r\n53 STKFG, 6 MNCFX, 46 VJHF, 81 HVMC, 68 CXFTF, 25 GNMV => 1 FUEL\r\n22 VJHF, 37 MNCFX => 5 FWMGM\r\n139 ORE => 4 NVRVD\r\n144 ORE => 7 JNWZP\r\n5 MNCFX, 7 RFSQX, 2 FWMGM, 2 VPVL, 19 CXFTF => 3 HVMC\r\n5 VJHF, 7 MNCFX, 9 VPVL, 37 CXFTF => 6 GNMV\r\n145 ORE => 6 MNCFX\r\n1 NVRVD => 8 CXFTF\r\n1 VJHF, 6 MNCFX => 4 RFSQX\r\n176 ORE => 6 VJHF';

const test5 =
  '171 ORE => 8 CNZTR\r\n7 ZLQW, 3 BMBT, 9 XCVML, 26 XMNCP, 1 WPTQ, 2 MZWV, 1 RJRHP => 4 PLWSL\r\n114 ORE => 4 BHXH\r\n14 VRPVC => 6 BMBT\r\n6 BHXH, 18 KTJDG, 12 WPTQ, 7 PLWSL, 31 FHTLT, 37 ZDVW => 1 FUEL\r\n6 WPTQ, 2 BMBT, 8 ZLQW, 18 KTJDG, 1 XMNCP, 6 MZWV, 1 RJRHP => 6 FHTLT\r\n15 XDBXC, 2 LTCX, 1 VRPVC => 6 ZLQW\r\n13 WPTQ, 10 LTCX, 3 RJRHP, 14 XMNCP, 2 MZWV, 1 ZLQW => 1 ZDVW\r\n5 BMBT => 4 WPTQ\r\n189 ORE => 9 KTJDG\r\n1 MZWV, 17 XDBXC, 3 XCVML => 2 XMNCP\r\n12 VRPVC, 27 CNZTR => 2 XDBXC\r\n15 KTJDG, 12 BHXH => 5 XCVML\r\n3 BHXH, 2 VRPVC => 7 MZWV\r\n121 ORE => 7 VRPVC\r\n7 XCVML => 6 RJRHP\r\n5 BHXH, 4 VRPVC => 5 LTCX';

const tryTest = (strTest, expected) => {
  const result = minOreProduceFuel(strTest).count;
  result === expected ? console.log(true) : console.log(false, 'res=' + result, 'expected=' + expected);
};

tryTest(test1, 31);
tryTest(test2, 165);
tryTest(test3, 13312);
tryTest(test4, 180697);
tryTest(test5, 2210736);

console.time('part1');
console.log(minOreProduceFuel(input).count);
console.timeEnd('part1');
console.time('part2');
console.log(maxFuel(input, 1000000000000));
console.timeEnd('part2');
