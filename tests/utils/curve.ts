import * as anchor from "@coral-xyz/anchor";

export interface ConstantProduct {
  constantProduct: {};
}
export interface Stable {
  stable: {
    amp: anchor.BN;
    tokenMultiplier: TokenMultiplier;
    depeg: Depeg;
    lastAmpUpdatedTimestamp: anchor.BN;
  };
}

export interface DepegNone {
  none: {};
}

export interface DepegMarinade {
  marinade: {};
}

export interface DepegLido {
  lido: {};
}

export interface TokenMultiplier {
  tokenAMultiplier: anchor.BN;
  tokenBMultiplier: anchor.BN;
  precisionFactor: number;
}

export interface Depeg {
  baseVirtualPrice: anchor.BN;
  baseCacheUpdated: anchor.BN;
  depegType: DepegNone | DepegLido | DepegMarinade;
}

export const DepegType = {
  none: (): DepegNone => {
    return {
      none: {},
    };
  },
  marinade: (): DepegMarinade => {
    return {
      marinade: {},
    };
  },
  lido: (): DepegLido => {
    return {
      lido: {},
    };
  },
};

export const CurveType = {
  stable: (
    amp: anchor.BN,
    tokenMultiplier: TokenMultiplier,
    depeg: Depeg,
    lastAmpUpdatedTimestamp: anchor.BN
  ): Stable => {
    return {
      stable: {
        amp,
        tokenMultiplier,
        depeg,
        lastAmpUpdatedTimestamp,
      },
    };
  },

  constantProduct: (): ConstantProduct => {
    return {
      constantProduct: {},
    };
  },
};
