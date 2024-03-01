export enum VoteSide {
  /**
   * A vote that has not been set or has been unset.
   */
  Pending = 0,
  /**
   * Vote against the passing of the proposal.
   */
  Against = 1,
  /**
   * Vote to make the proposal pass.
   */
  For = 2,
  /**
   * This vote does not count as a `For` or `Against`, but it still contributes to quorum.
   */
  Abstain = 0,
}
