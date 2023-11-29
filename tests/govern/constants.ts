

import * as anchor from "@coral-xyz/anchor";
const BN = anchor.BN;
type BN = anchor.BN;

export const DEFAULT_DECIMALS = 6;

export const ONE_DAY = new BN(24 * 60 * 60);

/**
 * Number of seconds in one year.
 */
export const ONE_YEAR = new BN(365).mul(ONE_DAY);

// Default number of votes in support of a proposal required in order for a quorum to be reached and for a vote to succeed
// ~ 4% of 10 billion
export const DEFAULT_QUORUM_VOTES = new BN(10000000000 * 0.04).mul(
    new BN(10).pow(new BN(DEFAULT_DECIMALS))
);
// Default number of votes required in order for a voter to become a proposer
// ~ 1% of 10 billion
export const DEFAULT_PROPOSAL_THRESHOLD = new BN(10000000000 * 0.01).mul(
    new BN(10).pow(new BN(DEFAULT_DECIMALS))
);
// Default delay before voting on a proposal may take place, once proposed, ~ 1 second
export const DEFAULT_VOTE_DELAY = new BN(1);
// Default duration of voting on a proposal, in seconds, ~ 3 days
export const DEFAULT_VOTE_PERIOD = new BN(3).mul(ONE_DAY);

/**
 * Default parameters for a Governor.
 */
export const DEFAULT_GOVERNANCE_PARAMETERS = {
    timelockDelaySeconds: new BN(0),
    quorumVotes: DEFAULT_QUORUM_VOTES,
    votingDelay: DEFAULT_VOTE_DELAY,
    votingPeriod: DEFAULT_VOTE_PERIOD,
};