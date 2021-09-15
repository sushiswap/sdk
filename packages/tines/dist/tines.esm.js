import { BigNumber } from '@ethersproject/bignumber';

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;

  _setPrototypeOf(subClass, superClass);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _construct(Parent, args, Class) {
  if (_isNativeReflectConstruct()) {
    _construct = Reflect.construct;
  } else {
    _construct = function _construct(Parent, args, Class) {
      var a = [null];
      a.push.apply(a, args);
      var Constructor = Function.bind.apply(Parent, a);
      var instance = new Constructor();
      if (Class) _setPrototypeOf(instance, Class.prototype);
      return instance;
    };
  }

  return _construct.apply(null, arguments);
}

function _isNativeFunction(fn) {
  return Function.toString.call(fn).indexOf("[native code]") !== -1;
}

function _wrapNativeSuper(Class) {
  var _cache = typeof Map === "function" ? new Map() : undefined;

  _wrapNativeSuper = function _wrapNativeSuper(Class) {
    if (Class === null || !_isNativeFunction(Class)) return Class;

    if (typeof Class !== "function") {
      throw new TypeError("Super expression must either be null or a function");
    }

    if (typeof _cache !== "undefined") {
      if (_cache.has(Class)) return _cache.get(Class);

      _cache.set(Class, Wrapper);
    }

    function Wrapper() {
      return _construct(Class, arguments, _getPrototypeOf(this).constructor);
    }

    Wrapper.prototype = Object.create(Class.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    return _setPrototypeOf(Wrapper, Class);
  };

  return _wrapNativeSuper(Class);
}

var PoolType;

(function (PoolType) {
  PoolType["ConstantProduct"] = "ConstantProduct";
  PoolType["Weighted"] = "Weighted";
  PoolType["Hybrid"] = "Hybrid";
  PoolType["ConcentratedLiquidity"] = "ConcentratedLiquidity";
})(PoolType || (PoolType = {}));

var Pool = function Pool(_info) {
  var info = _extends({
    minLiquidity: 1000,
    swapGasCost: 40000
  }, _info);

  this.address = info.address;
  this.token0 = info.token0;
  this.token1 = info.token1;
  this.type = info.type;
  this.reserve0 = info.reserve0;
  this.reserve1 = info.reserve1;
  this.fee = info.fee;
  this.minLiquidity = info.minLiquidity;
  this.swapGasCost = info.swapGasCost;
};
var RConstantProductPool = /*#__PURE__*/function (_Pool) {
  _inheritsLoose(RConstantProductPool, _Pool);

  function RConstantProductPool(info) {
    return _Pool.call(this, _extends({
      type: PoolType.ConstantProduct
    }, info)) || this;
  }

  return RConstantProductPool;
}(Pool);
var RHybridPool = /*#__PURE__*/function (_Pool2) {
  _inheritsLoose(RHybridPool, _Pool2);

  function RHybridPool(info) {
    var _this;

    _this = _Pool2.call(this, _extends({
      type: PoolType.Hybrid
    }, info)) || this;
    _this.A = info.A;
    return _this;
  }

  return RHybridPool;
}(Pool);
var RWeightedPool = /*#__PURE__*/function (_Pool3) {
  _inheritsLoose(RWeightedPool, _Pool3);

  function RWeightedPool(info) {
    var _this2;

    _this2 = _Pool3.call(this, _extends({
      type: PoolType.Weighted
    }, info)) || this;
    _this2.weight0 = info.weight0;
    _this2.weight1 = info.weight1;
    return _this2;
  }

  return RWeightedPool;
}(Pool);
var CL_MIN_TICK = -887272;
var CL_MAX_TICK = -CL_MIN_TICK - 1;
var RConcentratedLiquidityPool = /*#__PURE__*/function (_Pool4) {
  _inheritsLoose(RConcentratedLiquidityPool, _Pool4);

  function RConcentratedLiquidityPool(info) {
    var _this3;

    _this3 = _Pool4.call(this, _extends({
      type: PoolType.ConcentratedLiquidity,
      reserve0: BigNumber.from(0),
      reserve1: BigNumber.from(0)
    }, info)) || this;
    _this3.liquidity = info.liquidity;
    _this3.sqrtPrice = info.sqrtPrice;
    _this3.nearestTick = info.nearestTick;
    _this3.ticks = info.ticks;
    return _this3;
  }

  return RConcentratedLiquidityPool;
}(Pool);
var RouteStatus;

(function (RouteStatus) {
  RouteStatus["Success"] = "Success";
  RouteStatus["NoWay"] = "NoWay";
  RouteStatus["Partial"] = "Partial";
})(RouteStatus || (RouteStatus = {}));

var A_PRECISION = 100;
var DCacheBN = /*#__PURE__*/new Map();
function HybridComputeLiquidity(pool) {
  var res = DCacheBN.get(pool);
  if (res !== undefined) return res;
  var r0 = pool.reserve0;
  var r1 = pool.reserve1;

  if (r0.isZero() && r1.isZero()) {
    DCacheBN.set(pool, BigNumber.from(0));
    return BigNumber.from(0);
  }

  var s = r0.add(r1);
  var nA = BigNumber.from(pool.A * 2);
  var prevD;
  var D = s;

  for (var i = 0; i < 256; i++) {
    var dP = D.mul(D).div(r0).mul(D).div(r1).div(4);
    prevD = D;
    D = nA.mul(s).div(A_PRECISION).add(dP.mul(2)).mul(D).div(nA.div(A_PRECISION).sub(1).mul(D).add(dP.mul(3)));

    if (D.sub(prevD).abs().lte(1)) {
      break;
    }
  }

  DCacheBN.set(pool, D);
  return D;
}
function HybridgetY(pool, x) {
  var D = HybridComputeLiquidity(pool);
  var nA = pool.A * 2;
  var c = D.mul(D).div(x.mul(2)).mul(D).div(nA * 2 / A_PRECISION);
  var b = D.mul(A_PRECISION).div(nA).add(x);
  var yPrev;
  var y = D;

  for (var i = 0; i < 256; i++) {
    yPrev = y;
    y = y.mul(y).add(c).div(y.mul(2).add(b).sub(D));

    if (y.sub(yPrev).abs().lte(1)) {
      break;
    }
  }

  return y;
}
function calcOutByIn(pool, amountIn, direction) {
  if (direction === void 0) {
    direction = true;
  }

  var xBN = direction ? pool.reserve0 : pool.reserve1;
  var yBN = direction ? pool.reserve1 : pool.reserve0;

  switch (pool.type) {
    case PoolType.ConstantProduct:
      {
        var x = parseInt(xBN.toString());
        var y = parseInt(yBN.toString());
        return y * amountIn / (x / (1 - pool.fee) + amountIn);
      }

    case PoolType.Weighted:
      {
        var _x = parseInt(xBN.toString());

        var _y = parseInt(yBN.toString());

        var wPool = pool;
        var weightRatio = direction ? wPool.weight0 / wPool.weight1 : wPool.weight1 / wPool.weight0;
        var actualIn = amountIn * (1 - pool.fee);

        var out = _y * (1 - Math.pow(_x / (_x + actualIn), weightRatio));

        return out;
      }

    case PoolType.Hybrid:
      {
        // const xNew = x + amountIn*(1-pool.fee);
        // const yNew = HybridgetY(pool, xNew);
        // const dy = y - yNew;
        var xNewBN = xBN.add(getBigNumber(undefined, amountIn * (1 - pool.fee)));
        var yNewBN = HybridgetY(pool, xNewBN);
        var dy = parseInt(yBN.sub(yNewBN).toString());
        return dy;
      }

    case PoolType.ConcentratedLiquidity:
      {
        return ConcentratedLiquidityOutByIn(pool, amountIn, direction);
      }
  }
}
var OutOfLiquidity = /*#__PURE__*/function (_Error) {
  _inheritsLoose(OutOfLiquidity, _Error);

  function OutOfLiquidity() {
    return _Error.apply(this, arguments) || this;
  }

  return OutOfLiquidity;
}( /*#__PURE__*/_wrapNativeSuper(Error));

function ConcentratedLiquidityOutByIn(pool, inAmount, direction) {
  if (pool.ticks.length === 0) return 0;
  if (pool.ticks[0].index > CL_MIN_TICK) pool.ticks.unshift({
    index: CL_MIN_TICK,
    DLiquidity: 0
  });
  if (pool.ticks[pool.ticks.length - 1].index < CL_MAX_TICK) pool.ticks.push({
    index: CL_MAX_TICK,
    DLiquidity: 0
  });
  var nextTickToCross = direction ? pool.nearestTick : pool.nearestTick + 1;
  var currentPrice = pool.sqrtPrice;
  var currentLiquidity = pool.liquidity;
  var outAmount = 0;
  var input = inAmount;

  while (input > 0) {
    if (nextTickToCross < 0 || nextTickToCross >= pool.ticks.length) throw new OutOfLiquidity();
    var nextTickPrice = Math.sqrt(Math.pow(1.0001, pool.ticks[nextTickToCross].index)); // console.log('L, P, tick, nextP', currentLiquidity,
    //     currentPrice, pool.ticks[nextTickToCross].index, nextTickPrice);

    var output = 0;

    if (direction) {
      var maxDx = currentLiquidity * (currentPrice - nextTickPrice) / currentPrice / nextTickPrice; //console.log('input, maxDx', input, maxDx);

      if (input <= maxDx) {
        output = currentLiquidity * currentPrice * input / (input + currentLiquidity / currentPrice);
        input = 0;
      } else {
        output = currentLiquidity * (currentPrice - nextTickPrice);
        currentPrice = nextTickPrice;
        input -= maxDx;

        if (pool.ticks[nextTickToCross].index % 2 === 0) {
          currentLiquidity -= pool.ticks[nextTickToCross].DLiquidity;
        } else {
          currentLiquidity += pool.ticks[nextTickToCross].DLiquidity;
        }

        nextTickToCross--;
      }
    } else {
      var maxDy = currentLiquidity * (nextTickPrice - currentPrice); //console.log('input, maxDy', input, maxDy);

      if (input <= maxDy) {
        output = input / currentPrice / (currentPrice + input / currentLiquidity);
        input = 0;
      } else {
        output = currentLiquidity * (nextTickPrice - currentPrice) / currentPrice / nextTickPrice;
        currentPrice = nextTickPrice;
        input -= maxDy;

        if (pool.ticks[nextTickToCross].index % 2 === 0) {
          currentLiquidity += pool.ticks[nextTickToCross].DLiquidity;
        } else {
          currentLiquidity -= pool.ticks[nextTickToCross].DLiquidity;
        }

        nextTickToCross++;
      }
    }

    outAmount += output * (1 - pool.fee); //console.log('out', outAmount);
  }

  return outAmount;
}

function calcInByOut(pool, amountOut, direction) {
  var input = 0;
  var xBN = direction ? pool.reserve0 : pool.reserve1;
  var yBN = direction ? pool.reserve1 : pool.reserve0;

  switch (pool.type) {
    case PoolType.ConstantProduct:
      {
        var x = parseInt(xBN.toString());
        var y = parseInt(yBN.toString());
        input = x * amountOut / (1 - pool.fee) / (y - amountOut);
        break;
      }

    case PoolType.Weighted:
      {
        var _x2 = parseInt(xBN.toString());

        var _y2 = parseInt(yBN.toString());

        var wPool = pool;
        var weightRatio = direction ? wPool.weight0 / wPool.weight1 : wPool.weight1 / wPool.weight0;
        input = _x2 * (1 - pool.fee) * (Math.pow(1 - amountOut / _y2, -weightRatio) - 1);
        break;
      }

    case PoolType.Hybrid:
      {
        var yNewBN = yBN.sub(getBigNumber(undefined, amountOut));
        if (yNewBN.lt(1)) // lack of precision
          yNewBN = BigNumber.from(1);
        var xNewBN = HybridgetY(pool, yNewBN);
        input = Math.round(parseInt(xNewBN.sub(xBN).toString()) / (1 - pool.fee)); // const yNew = y - amountOut;
        // const xNew = HybridgetY(pool, yNew);
        // input = (xNew - x)/(1-pool.fee);

        break;
      }

    default:
      console.error("Unknown pool type");
  } // ASSERT(() => {
  //   const amount2 = calcOutByIn(pool, input, direction);
  //   const res = closeValues(amountOut, amount2, 1e-6);
  //   if (!res) console.log("Error 138:", amountOut, amount2, Math.abs(amountOut/amount2 - 1));
  //   return res;
  // });


  if (input < 1) input = 1;
  return input;
}
function calcPrice(pool, amountIn, takeFeeIntoAccount) {
  if (takeFeeIntoAccount === void 0) {
    takeFeeIntoAccount = true;
  }

  var r0 = parseInt(pool.reserve0.toString());
  var r1 = parseInt(pool.reserve1.toString());
  var oneMinusFee = takeFeeIntoAccount ? 1 - pool.fee : 1;

  switch (pool.type) {
    case PoolType.ConstantProduct:
      {
        var x = r0 / oneMinusFee;
        return r1 * x / (x + amountIn) / (x + amountIn);
      }

    case PoolType.Weighted:
      {
        var wPool = pool;
        var weightRatio = wPool.weight0 / wPool.weight1;

        var _x3 = r0 + amountIn * oneMinusFee;

        return r1 * weightRatio * oneMinusFee * Math.pow(r0 / _x3, weightRatio) / _x3;
      }

    case PoolType.Hybrid:
      {
        var hPool = pool;
        var D = parseInt(HybridComputeLiquidity(hPool).toString());
        var A = hPool.A / A_PRECISION;

        var _x4 = r0 + amountIn;

        var b = 4 * A * _x4 + D - 4 * A * D;
        var ac4 = D * D * D / _x4;
        var Ds = Math.sqrt(b * b + 4 * A * ac4);
        var res = (0.5 - (2 * b - ac4 / _x4) / Ds / 4) * oneMinusFee;
        return res;
      }
  }

  return 0;
}

function calcInputByPriceConstantMean(pool, price) {
  var r0 = parseInt(pool.reserve0.toString());
  var r1 = parseInt(pool.reserve1.toString());
  var weightRatio = pool.weight0 / pool.weight1;
  var t = r1 * price * weightRatio * (1 - pool.fee) * Math.pow(r0, weightRatio);
  return (Math.pow(t, 1 / (weightRatio + 1)) - r0) / (1 - pool.fee);
}

function calcInputByPrice(pool, priceEffective, hint) {
  if (hint === void 0) {
    hint = 1;
  }

  switch (pool.type) {
    case PoolType.ConstantProduct:
      {
        var r0 = parseInt(pool.reserve0.toString());
        var r1 = parseInt(pool.reserve1.toString());
        var x = r0 / (1 - pool.fee);
        var res = Math.sqrt(r1 * x * priceEffective) - x;
        return res;
      }

    case PoolType.Weighted:
      {
        var _res = calcInputByPriceConstantMean(pool, priceEffective);

        return _res;
      }

    case PoolType.Hybrid:
      {
        return revertPositive(function (x) {
          return 1 / calcPrice(pool, x);
        }, priceEffective, hint);
      }
  }

  return 0;
} //================================= Utils ====================================

function ASSERT(f, t) {
  if (!f() && t) console.error(t);
}
function closeValues(a, b, accuracy) {
  if (accuracy === 0) return a === b;
  if (a < 1 / accuracy) return Math.abs(a - b) <= 10;
  return Math.abs(a / b - 1) < accuracy;
}
function calcSquareEquation(a, b, c) {
  var D = b * b - 4 * a * c;
  console.assert(D >= 0, "Discriminant is negative! " + a + " " + b + " " + c);
  var sqrtD = Math.sqrt(D);
  return [(-b - sqrtD) / 2 / a, (-b + sqrtD) / 2 / a];
} // returns such x > 0 that f(x) = out or 0 if there is no such x or f defined not everywhere
// hint - approximation of x to spead up the algorithm
// f assumed to be continues monotone growth function defined everywhere

function revertPositive(f, out, hint) {
  if (hint === void 0) {
    hint = 1;
  }

  try {
    if (out <= f(0)) return 0;
    var min, max;

    if (f(hint) > out) {
      min = hint / 2;

      while (f(min) > out) {
        min /= 2;
      }

      max = min * 2;
    } else {
      max = hint * 2;

      while (f(max) < out) {
        max *= 2;
      }

      min = max / 2;
    }

    while (max / min - 1 > 1e-4) {
      var x0 = (min + max) / 2;
      var y0 = f(x0);
      if (out === y0) return x0;
      if (out < y0) max = x0;else min = x0;
    }

    return (min + max) / 2;
  } catch (e) {
    return 0;
  }
}
function getBigNumber(valueBN, value) {
  if (valueBN !== undefined) return valueBN;
  if (value < Number.MAX_SAFE_INTEGER) return BigNumber.from(Math.round(value));
  var exp = Math.floor(Math.log(value) / Math.LN2);
  console.assert(exp >= 51, "Internal Error 314");
  var shift = exp - 51;
  var mant = Math.round(value / Math.pow(2, shift));
  var res = BigNumber.from(mant).mul(BigNumber.from(2).pow(shift));
  return res;
}

var Edge = /*#__PURE__*/function () {
  function Edge(p, v0, v1) {
    this.GasConsumption = 40000;
    this.MINIMUM_LIQUIDITY = 1000;
    this.pool = p;
    this.vert0 = v0;
    this.vert1 = v1;
    this.amountInPrevious = 0;
    this.amountOutPrevious = 0;
    this.canBeUsed = true;
    this.direction = true;
    this.bestEdgeIncome = 0;
  }

  var _proto = Edge.prototype;

  _proto.reserve = function reserve(v) {
    return v === this.vert0 ? this.pool.reserve0 : this.pool.reserve1;
  };

  _proto.calcOutput = function calcOutput(v, amountIn) {
    var pool = this.pool;
    var out,
        gas = this.amountInPrevious ? 0 : this.GasConsumption;

    if (v === this.vert1) {
      if (this.direction) {
        if (amountIn < this.amountOutPrevious) {
          out = this.amountInPrevious - calcInByOut(pool, this.amountOutPrevious - amountIn, true);
        } else {
          out = calcOutByIn(pool, amountIn - this.amountOutPrevious, false) + this.amountInPrevious;
        }

        if (amountIn === this.amountOutPrevious) {
          // TODO: accuracy?
          gas = -this.GasConsumption;
        }
      } else {
        out = calcOutByIn(pool, this.amountOutPrevious + amountIn, false) - this.amountInPrevious;
      }
    } else {
      if (this.direction) {
        out = calcOutByIn(pool, this.amountInPrevious + amountIn, true) - this.amountOutPrevious;
      } else {
        if (amountIn === this.amountInPrevious) {
          // TODO: accuracy?
          gas = -this.GasConsumption;
        }

        if (amountIn < this.amountInPrevious) {
          out = this.amountOutPrevious - calcInByOut(pool, this.amountInPrevious - amountIn, false);
        } else {
          out = calcOutByIn(pool, amountIn - this.amountInPrevious, true) + this.amountOutPrevious;
        }
      }
    } // this.testApply(v, amountIn, out);


    return [out, gas];
  };

  _proto.checkMinimalLiquidityExceededAfterSwap = function checkMinimalLiquidityExceededAfterSwap(from, amountOut) {
    if (from === this.vert0) {
      var r1 = parseInt(this.pool.reserve1.toString());

      if (this.direction) {
        return r1 - amountOut - this.amountOutPrevious < this.MINIMUM_LIQUIDITY;
      } else {
        return r1 - amountOut + this.amountOutPrevious < this.MINIMUM_LIQUIDITY;
      }
    } else {
      var r0 = parseInt(this.pool.reserve0.toString());

      if (this.direction) {
        return r0 - amountOut + this.amountInPrevious < this.MINIMUM_LIQUIDITY;
      } else {
        return r0 - amountOut - this.amountInPrevious < this.MINIMUM_LIQUIDITY;
      }
    }
  } // doesn't used in production - just for testing
  ;

  _proto.testApply = function testApply(from, amountIn, amountOut) {
    console.assert(this.amountInPrevious * this.amountOutPrevious >= 0);
    var inPrev = this.direction ? this.amountInPrevious : -this.amountInPrevious;
    var outPrev = this.direction ? this.amountOutPrevious : -this.amountOutPrevious;
    var to = from.getNeibour(this);
    var directionNew,
        amountInNew = 0,
        amountOutNew = 0;

    if (to) {
      var inInc = from === this.vert0 ? amountIn : -amountOut;
      var outInc = from === this.vert0 ? amountOut : -amountIn;
      var inNew = inPrev + inInc;
      var outNew = outPrev + outInc;
      if (inNew * outNew < 0) console.log("333");
      console.assert(inNew * outNew >= 0);

      if (inNew >= 0) {
        directionNew = true;
        amountInNew = inNew;
        amountOutNew = outNew;
      } else {
        directionNew = false;
        amountInNew = -inNew;
        amountOutNew = -outNew;
      }
    } else console.error("Error 221");

    if (directionNew) {
      var calc = calcOutByIn(this.pool, amountInNew, directionNew);
      var res = closeValues(amountOutNew, calc, 1e-6);
      if (!res) console.log("Err 225-1 !!", amountOutNew, calc, Math.abs(calc / amountOutNew - 1));
      return res;
    } else {
      var _calc = calcOutByIn(this.pool, amountOutNew, directionNew);

      var _res = closeValues(amountInNew, _calc, 1e-6);

      if (!_res) console.log("Err 225-2!!", amountInNew, _calc, Math.abs(_calc / amountInNew - 1));
      return _res;
    }
  };

  _proto.applySwap = function applySwap(from) {
    var _this = this;

    console.assert(this.amountInPrevious * this.amountOutPrevious >= 0);
    var inPrev = this.direction ? this.amountInPrevious : -this.amountInPrevious;
    var outPrev = this.direction ? this.amountOutPrevious : -this.amountOutPrevious;
    var to = from.getNeibour(this);

    if (to) {
      var inInc = from === this.vert0 ? from.bestIncome : -to.bestIncome;
      var outInc = from === this.vert0 ? to.bestIncome : -from.bestIncome;
      var inNew = inPrev + inInc;
      var outNew = outPrev + outInc;
      console.assert(inNew * outNew >= 0);

      if (inNew >= 0) {
        this.direction = true;
        this.amountInPrevious = inNew;
        this.amountOutPrevious = outNew;
      } else {
        this.direction = false;
        this.amountInPrevious = -inNew;
        this.amountOutPrevious = -outNew;
      }
    } else console.error("Error 221");

    ASSERT(function () {
      if (_this.direction) return closeValues(_this.amountOutPrevious, calcOutByIn(_this.pool, _this.amountInPrevious, _this.direction), 1e-6);else {
        return closeValues(_this.amountInPrevious, calcOutByIn(_this.pool, _this.amountOutPrevious, _this.direction), 1e-6);
      }
    }, "Error 225");
  };

  return Edge;
}();
var Vertice = /*#__PURE__*/function () {
  function Vertice(t) {
    this.token = t;
    this.edges = [];
    this.price = 0;
    this.gasPrice = 0;
    this.bestIncome = 0;
    this.gasSpent = 0;
    this.bestTotal = 0;
    this.bestSource = undefined;
    this.checkLine = -1;
  }

  var _proto2 = Vertice.prototype;

  _proto2.getNeibour = function getNeibour(e) {
    if (!e) return;
    return e.vert0 === this ? e.vert1 : e.vert0;
  };

  return Vertice;
}();
var Graph = /*#__PURE__*/function () {
  function Graph(pools, baseToken, gasPrice) {
    var _this2 = this;

    this.vertices = [];
    this.edges = [];
    this.tokens = new Map();
    pools.forEach(function (p) {
      var v0 = _this2.getOrCreateVertice(p.token0);

      var v1 = _this2.getOrCreateVertice(p.token1);

      var edge = new Edge(p, v0, v1);
      v0.edges.push(edge);
      v1.edges.push(edge);

      _this2.edges.push(edge);
    });
    var baseVert = this.tokens.get(baseToken);

    if (baseVert) {
      this.setPrices(baseVert, 1, gasPrice);
    }
  }

  var _proto3 = Graph.prototype;

  _proto3.setPrices = function setPrices(from, price, gasPrice) {
    var _this3 = this;

    if (from.price !== 0) return;
    from.price = price;
    from.gasPrice = gasPrice;
    var edges = from.edges.map(function (e) {
      return [e, parseInt(e.reserve(from).toString())];
    }).sort(function (_ref, _ref2) {
      var r1 = _ref[1];
      var r2 = _ref2[1];
      return r2 - r1;
    });
    edges.forEach(function (_ref3) {
      var e = _ref3[0];
      var v = e.vert0 === from ? e.vert1 : e.vert0;
      if (v.price !== 0) return;
      var p = calcPrice(e.pool, 0, false);
      if (from === e.vert0) p = 1 / p;

      _this3.setPrices(v, price * p, gasPrice / p);
    });
  };

  _proto3.getOrCreateVertice = function getOrCreateVertice(token) {
    var vert = this.tokens.get(token);
    if (vert) return vert;
    vert = new Vertice(token);
    this.vertices.push(vert);
    this.tokens.set(token, vert);
    return vert;
  };

  _proto3.exportPath = function exportPath(from, to) {
    //}, _route: MultiRoute) {
    // const allPools = new Map<string, Pool>();
    // this.edges.forEach(p => allPools.set(p.address, p));
    // const usedPools = new Map<string, boolean>();
    // route.legs.forEach(l => usedPools.set(l.address, l.token === allPools.get(l.address)?.token0))
    var fromVert = this.tokens.get(from);
    var toVert = this.tokens.get(to);
    var initValue = fromVert.bestIncome * fromVert.price / toVert.price;
    var route = new Set();

    for (var v = toVert; v !== fromVert; v = v.getNeibour(v.bestSource)) {
      if (v.bestSource) route.add(v.bestSource);
    }

    function edgeStyle(e) {
      var finish = e.vert1.bestSource === e;
      var start = e.vert0.bestSource === e;
      var label;
      if (e.bestEdgeIncome === -1) label = 'label: "low_liq"';
      if (e.bestEdgeIncome !== 0) label = "label: \"" + print((e.bestEdgeIncome / initValue - 1) * 100, 3) + "%\"";
      var edgeValue = route.has(e) ? "value: 2" : undefined;
      var arrow;
      if (finish && start) arrow = 'arrows: "from,to"';
      if (finish) arrow = 'arrows: "to"';
      if (start) arrow = 'arrows: "from"';
      return ["", label, edgeValue, arrow].filter(function (a) {
        return a !== undefined;
      }).join(", ");
    }

    function print(n, digits) {
      var out;
      if (n === 0) out = "0";else {
        var n0 = n > 0 ? n : -n;
        var shift = digits - Math.ceil(Math.log(n0) / Math.LN10);
        if (shift <= 0) out = "" + Math.round(n0);else {
          var mult = Math.pow(10, shift);
          out = "" + Math.round(n0 * mult) / mult;
        }
        if (n < 0) out = -out;
      }
      return out;
    }

    function nodeLabel(v) {
      var value = v.bestIncome * v.price / toVert.price;
      var income = "" + print(value, 3);
      var total = "" + print(v.bestTotal, 3); // const income = `${print((value/initValue-1)*100, 3)}%`
      // const total = `${print((v.bestTotal/initValue-1)*100, 3)}%`

      var checkLine = v.checkLine === -1 ? undefined : "" + v.checkLine;
      return [checkLine, income, total].filter(function (a) {
        return a !== undefined;
      }).join(":");
    }

    var nodes = "var nodes = new vis.DataSet([\n      " + this.vertices.map(function (t) {
      return "{ id: " + t.token.name + ", label: \"" + nodeLabel(t) + "\"}";
    }).join(",\n\t\t") + "\n    ]);\n";
    var edges = "var edges = new vis.DataSet([\n      " + this.edges.map(function (p) {
      return "{ from: " + p.vert0.token.name + ", to: " + p.vert1.token.name + edgeStyle(p) + "}";
    }).join(",\n\t\t") + "\n    ]);\n";
    var data = "var data = {\n        nodes: nodes,\n        edges: edges,\n    };\n"; // TODO: This should be removed, this pacakge will not be installable on a client while this remains.

    var fs = require("fs");

    fs.writeFileSync("D:/Info/Notes/GraphVisualization/data.js", nodes + edges + data);
  };

  _proto3.findBestPath = function findBestPath(from, to, amountIn) {
    var start = this.tokens.get(from);
    var finish = this.tokens.get(to);
    if (!start || !finish) return;
    this.edges.forEach(function (e) {
      return e.bestEdgeIncome = 0;
    });
    this.vertices.forEach(function (v) {
      v.bestIncome = 0;
      v.gasSpent = 0;
      v.bestTotal = 0;
      v.bestSource = undefined;
      v.checkLine = -1;
    });
    start.bestIncome = amountIn;
    start.bestTotal = amountIn;
    var processedVert = new Set();
    var nextVertList = [start]; // TODO: Use sorted Set!

    var checkLine = 0;

    var _loop = function _loop() {
      var closestVert = void 0;
      var closestTotal = -1;
      var closestPosition = 0;
      nextVertList.forEach(function (v, i) {
        if (v.bestTotal > closestTotal) {
          closestTotal = v.bestTotal;
          closestVert = v;
          closestPosition = i;
        }
      });
      if (!closestVert) return {
        v: void 0
      };
      closestVert.checkLine = checkLine++;

      if (closestVert === finish) {
        var bestPath = [];

        for (var v = finish; (_v = v) != null && _v.bestSource; v = v.getNeibour(v.bestSource)) {
          var _v;

          bestPath.unshift(v.bestSource);
        }

        return {
          v: {
            path: bestPath,
            output: finish.bestIncome,
            gasSpent: finish.gasSpent,
            totalOutput: finish.bestTotal
          }
        };
      }

      nextVertList.splice(closestPosition, 1);
      closestVert.edges.forEach(function (e) {
        var v2 = closestVert === e.vert0 ? e.vert1 : e.vert0;
        if (processedVert.has(v2)) return;
        var newIncome, gas;

        try {
          var _e$calcOutput = e.calcOutput(closestVert, closestVert.bestIncome);

          newIncome = _e$calcOutput[0];
          gas = _e$calcOutput[1];
        } catch (e) {
          // Any arithmetic error or out-of-liquidity
          return;
        }

        if (e.checkMinimalLiquidityExceededAfterSwap(closestVert, newIncome)) {
          e.bestEdgeIncome = -1;
          return;
        }

        var newGasSpent = closestVert.gasSpent + gas;
        var price = v2.price / finish.price;
        var newTotal = newIncome * price - newGasSpent * finish.gasPrice;
        console.assert(e.bestEdgeIncome === 0, "Error 373");
        e.bestEdgeIncome = newIncome * price;
        if (!v2.bestSource) nextVertList.push(v2);

        if (!v2.bestSource || newTotal > v2.bestTotal) {
          v2.bestIncome = newIncome;
          v2.gasSpent = newGasSpent;
          v2.bestTotal = newTotal;
          v2.bestSource = e;
        }
      });
      processedVert.add(closestVert);
    };

    for (;;) {
      var _ret = _loop();

      if (typeof _ret === "object") return _ret.v;
    }
  };

  _proto3.addPath = function addPath(from, to, path) {
    var _this4 = this;

    var _from = from;
    path.forEach(function (e) {
      if (_from) {
        e.applySwap(_from);
        _from = _from.getNeibour(e);
      } else {
        console.error("Unexpected 315");
      }
    });
    ASSERT(function () {
      var res = _this4.vertices.every(function (v) {
        var total = 0;
        var totalModule = 0;
        v.edges.forEach(function (e) {
          if (e.vert0 === v) {
            if (e.direction) {
              total -= e.amountInPrevious;
            } else {
              total += e.amountInPrevious;
            }

            totalModule += e.amountInPrevious;
          } else {
            if (e.direction) {
              total += e.amountOutPrevious;
            } else {
              total -= e.amountOutPrevious;
            }

            totalModule += e.amountOutPrevious;
          }
        });
        if (v === from) return total <= 0;
        if (v === to) return total >= 0;
        if (totalModule === 0) return total === 0;
        return Math.abs(total / totalModule) < 1e10;
      });

      return res;
    }, "Error 290");
  };

  _proto3.findBestRoute = function findBestRoute(from, to, amountIn, mode) {
    var routeValues = [];

    if (Array.isArray(mode)) {
      var sum = mode.reduce(function (a, b) {
        return a + b;
      }, 0);
      routeValues = mode.map(function (e) {
        return e / sum;
      });
    } else {
      for (var i = 0; i < mode; ++i) {
        routeValues.push(1 / mode);
      }
    }

    this.edges.forEach(function (e) {
      e.amountInPrevious = 0;
      e.amountOutPrevious = 0;
      e.direction = true;
    });
    var output = 0;
    var gasSpentInit = 0; //let totalOutput = 0

    var totalrouted = 0;
    var step;

    for (step = 0; step < routeValues.length; ++step) {
      var p = this.findBestPath(from, to, amountIn * routeValues[step]);

      if (!p) {
        break;
      } else {
        output += p.output;
        gasSpentInit += p.gasSpent; //totalOutput += p.totalOutput

        this.addPath(this.tokens.get(from), this.tokens.get(to), p.path);
        totalrouted += routeValues[step];
      }
    }

    if (step == 0) return {
      status: RouteStatus.NoWay,
      amountIn: 0,
      amountOut: 0,
      legs: [],
      gasSpent: 0,
      totalAmountOut: 0
    };
    var status;
    if (step < routeValues.length) status = RouteStatus.Partial;else status = RouteStatus.Success;
    var fromVert = this.tokens.get(from);
    var toVert = this.tokens.get(to);

    var _this$getRouteLegs = this.getRouteLegs(fromVert, toVert),
        legs = _this$getRouteLegs[0],
        gasSpent = _this$getRouteLegs[1],
        topologyWasChanged = _this$getRouteLegs[2];

    console.assert(gasSpent <= gasSpentInit, "Internal Error 491");

    if (topologyWasChanged) {
      output = this.calcLegsAmountOut(legs, amountIn, to);
    }

    return {
      status: status,
      amountIn: amountIn * totalrouted,
      amountOut: output,
      legs: legs,
      gasSpent: gasSpent,
      totalAmountOut: output - gasSpent * toVert.gasPrice
    };
  };

  _proto3.getRouteLegs = function getRouteLegs(from, to) {
    var _this5 = this;

    var _this$cleanTopology = this.cleanTopology(from, to),
        nodes = _this$cleanTopology[0],
        topologyWasChanged = _this$cleanTopology[1];

    var legs = [];
    var gasSpent = 0;
    nodes.forEach(function (n) {
      var outEdges = _this5.getOutputEdges(n).map(function (e) {
        var from = _this5.edgeFrom(e);

        return from ? [e, from[0], from[1]] : [e];
      });

      var outAmount = outEdges.reduce(function (a, b) {
        return a + b[2];
      }, 0);
      if (outAmount <= 0) return;
      var total = outAmount;
      outEdges.forEach(function (e, i) {
        var p = e[2];
        var quantity = i + 1 === outEdges.length ? 1 : p / outAmount;
        legs.push({
          address: e[0].pool.address,
          token: n.token,
          swapPortion: quantity,
          absolutePortion: p / total
        });
        gasSpent += e[0].pool.swapGasCost;
        outAmount -= p;
      });
      console.assert(outAmount / total < 1e-12, "Error 281");
    });
    return [legs, gasSpent, topologyWasChanged];
  };

  _proto3.edgeFrom = function edgeFrom(e) {
    if (e.amountInPrevious === 0) return undefined;
    return e.direction ? [e.vert0, e.amountInPrevious] : [e.vert1, e.amountOutPrevious];
  };

  _proto3.getOutputEdges = function getOutputEdges(v) {
    return v.edges.filter(function (e) {
      if (!e.canBeUsed) return false;
      if (e.amountInPrevious === 0) return false;
      if (e.direction !== (e.vert0 === v)) return false;
      return true;
    });
  };

  _proto3.getInputEdges = function getInputEdges(v) {
    return v.edges.filter(function (e) {
      if (!e.canBeUsed) return false;
      if (e.amountInPrevious === 0) return false;
      if (e.direction === (e.vert0 === v)) return false;
      return true;
    });
  };

  _proto3.calcLegsAmountOut = function calcLegsAmountOut(legs, amountIn, to) {
    var _this6 = this;

    var amounts = new Map();
    amounts.set(legs[0].token, amountIn);
    legs.forEach(function (l) {
      var vert = _this6.tokens.get(l.token);

      console.assert(vert !== undefined, "Internal Error 570");
      var edge = vert.edges.find(function (e) {
        return e.pool.address === l.address;
      });
      console.assert(edge !== undefined, "Internel Error 569");
      var pool = edge.pool;
      var direction = vert === edge.vert0;
      var inputTotal = amounts.get(l.token);
      console.assert(inputTotal !== undefined, "Internal Error 564");
      var input = inputTotal * l.swapPortion;
      amounts.set(l.token, inputTotal - input);
      var output = calcOutByIn(pool, input, direction);
      var vertNext = vert.getNeibour(edge);
      var prevAmount = amounts.get(vertNext.token);
      amounts.set(vertNext.token, (prevAmount || 0) + output);
    });
    return amounts.get(to) || 0;
  } // removes all cycles if there are any, then removes all dead end could appear after cycle removing
  // Returns clean result topologically sorted
  ;

  _proto3.cleanTopology = function cleanTopology(from, to) {
    var topologyWasChanged = false;
    var result = this.topologySort(from, to);

    if (result[0] !== 2) {
      topologyWasChanged = true;
      console.assert(result[0] === 0, "Internal Error 554");

      while (result[0] === 0) {
        this.removeWeakestEdge(result[1]);
        result = this.topologySort(from, to);
      }

      if (result[0] === 3) {
        this.removeDeadEnds(result[1]);
        result = this.topologySort(from, to);
      }

      console.assert(result[0] === 2, "Internal Error 563");
      if (result[0] !== 2) return [[], topologyWasChanged];
    }

    return [result[1], topologyWasChanged];
  };

  _proto3.removeDeadEnds = function removeDeadEnds(verts) {
    var _this7 = this;

    verts.forEach(function (v) {
      _this7.getInputEdges(v).forEach(function (e) {
        e.canBeUsed = false;
      });
    });
  };

  _proto3.removeWeakestEdge = function removeWeakestEdge(verts) {
    var _this8 = this;

    var minVert, minVertNext;
    var minOutput = Number.MAX_VALUE;
    verts.forEach(function (v1, i) {
      var v2 = i === 0 ? verts[verts.length - 1] : verts[i - 1];
      var out = 0;

      _this8.getOutputEdges(v1).forEach(function (e) {
        if (v1.getNeibour(e) !== v2) return;
        out += e.direction ? e.amountOutPrevious : e.amountInPrevious;
      });

      if (out < minOutput) {
        minVert = v1;
        minVertNext = v2;
        minOutput = out;
      }
    }); // @ts-ignore

    this.getOutputEdges(minVert).forEach(function (e) {
      if (minVert.getNeibour(e) !== minVertNext) return;
      e.canBeUsed = false;
    });
  } // topological sort
  // if there is a cycle - returns [0, <List of envolved vertices in the cycle>]
  // if there are no cycles but deadends- returns [3, <List of all envolved deadend vertices>]
  // if there are no cycles or deadends- returns [2, <List of all envolved vertices topologically sorted>]
  ;

  _proto3.topologySort = function topologySort(from, to) {
    // undefined or 0 - not processed, 1 - in process, 2 - finished, 3 - dedend
    var vertState = new Map();
    var vertsFinished = [];
    var foundCycle = [];
    var foundDeadEndVerts = [];
    var that = this; // 0 - cycle was found and created, return
    // 1 - during cycle creating
    // 2 - vertex is processed ok
    // 3 - dead end vertex

    function topSortRecursive(current) {
      var state = vertState.get(current);
      if (state === 2 || state === 3) return state;

      if (state === 1) {
        console.assert(foundCycle.length == 0, "Internal Error 566");
        foundCycle.push(current);
        return 1;
      }

      vertState.set(current, 1);
      var successors2Exist = false;
      var outEdges = that.getOutputEdges(current);

      for (var i = 0; i < outEdges.length; ++i) {
        var e = outEdges[i];

        var _res2 = topSortRecursive(current.getNeibour(e));

        if (_res2 === 0) return 0;

        if (_res2 === 1) {
          if (foundCycle[0] === current) return 0;else {
            foundCycle.push(current);
            return 1;
          }
        }

        if (_res2 === 2) successors2Exist = true; // Ok successors
      }

      if (successors2Exist) {
        console.assert(current !== to, "Internal Error 589");
        vertsFinished.push(current);
        vertState.set(current, 2);
        return 2;
      } else {
        if (current !== to) {
          foundDeadEndVerts.push(current);
          vertState.set(current, 3);
          return 3;
        }

        vertsFinished.push(current);
        vertState.set(current, 2);
        return 2;
      }
    }

    var res = topSortRecursive(from);
    if (res === 0) return [0, foundCycle];
    if (foundDeadEndVerts.length) return [3, foundDeadEndVerts];
    ASSERT(function () {
      if (vertsFinished[0] !== to) return false;
      if (vertsFinished[vertsFinished.length - 1] !== from) return false;
      return true;
    }, "Internal Error 614");
    if (res === 2) return [2, vertsFinished.reverse()];
    console.assert(true, "Internal Error 612");
    return [1, []];
  };

  return Graph;
}();
function findMultiRouting(from, to, amountIn, pools, baseToken, gasPrice, steps) {
  if (steps === void 0) {
    steps = 12;
  }

  var g = new Graph(pools, baseToken, gasPrice);
  var fromV = g.tokens.get(from);

  if ((fromV == null ? void 0 : fromV.price) === 0) {
    g.setPrices(fromV, 1, 0);
  }

  var out = g.findBestRoute(from, to, amountIn, steps);
  return out;
}

export { ASSERT, CL_MAX_TICK, CL_MIN_TICK, Edge, Graph, HybridComputeLiquidity, HybridgetY, OutOfLiquidity, Pool, PoolType, RConcentratedLiquidityPool, RConstantProductPool, RHybridPool, RWeightedPool, RouteStatus, Vertice, calcInByOut, calcInputByPrice, calcOutByIn, calcPrice, calcSquareEquation, closeValues, findMultiRouting, getBigNumber, revertPositive };
//# sourceMappingURL=tines.esm.js.map
