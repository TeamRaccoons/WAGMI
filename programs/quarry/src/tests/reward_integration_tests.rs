use crate::*;

#[test]
fn test_fund_reward() {
    let mut quarry = Quarry::default();
    let reward_index = 0usize;
    let reward_duration = 100;

    let reward_info = &mut quarry.reward_infos[reward_index];

    reward_info.init_reward(
        Pubkey::new_unique(),
        Pubkey::new_unique(),
        Pubkey::new_unique(),
        reward_duration,
    );

    let current_time = 100;
    let funding_amount = 100_000;

    // fund rewards
    reward_info
        .update_rate_after_funding(current_time, funding_amount)
        .unwrap();

    assert_eq!(reward_info.reward_rate > 0, true);
    assert_eq!(reward_info.last_update_time, current_time);

    assert_eq!(
        reward_info.reward_duration_end,
        current_time + reward_duration
    );

    let current_time = 200;
    // fund rewards
    reward_info
        .update_rate_after_funding(current_time, funding_amount)
        .unwrap();

    assert_eq!(reward_info.last_update_time, current_time);

    assert_eq!(
        reward_info.reward_duration_end,
        current_time + reward_duration
    );
}

#[test]
fn test_claim_reward() {
    let mut quarry = Quarry::default();
    let rewarder = Rewarder::default();
    let mut miner = Miner::default();

    //stake
    let current_time = 100;
    let amount = 100_000;
    quarry
        .process_stake_action_internal(
            StakeAction::Stake,
            current_time,
            &rewarder,
            &mut miner,
            amount,
        )
        .unwrap();

    assert_eq!(quarry.total_tokens_deposited, amount);
    // init reward
    let reward_index = 0;
    let reward_duration = 100;
    let reward_info: &mut RewardInfo = &mut quarry.reward_infos[reward_index];

    reward_info.init_reward(
        Pubkey::new_unique(),
        Pubkey::new_unique(),
        Pubkey::new_unique(),
        reward_duration,
    );

    // fund rewards
    let funding_amount = 200_000;
    reward_info
        .update_rate_after_funding(current_time as u64, funding_amount)
        .unwrap();

    // user claim
    let current_time = current_time + reward_duration as i64;
    quarry
        .update_rewards_and_miner(&mut miner, &rewarder, current_time)
        .unwrap();

    let user_reward_reward = miner.reward_infos[reward_index];
    assert_eq!(user_reward_reward.reward_pending, funding_amount);
}

#[test]
fn test_two_user_claim_reward() {
    let mut quarry = Quarry::default();
    let rewarder = Rewarder::default();
    let mut miner_1 = Miner::default();
    let mut miner_2 = Miner::default();

    //stake
    let current_time = 100;
    let amount = 100_000;
    quarry
        .process_stake_action_internal(
            StakeAction::Stake,
            current_time,
            &rewarder,
            &mut miner_1,
            amount,
        )
        .unwrap();

    quarry
        .process_stake_action_internal(
            StakeAction::Stake,
            current_time,
            &rewarder,
            &mut miner_2,
            amount,
        )
        .unwrap();

    assert_eq!(quarry.total_tokens_deposited, amount * 2);
    // init reward
    let reward_index = 0;
    let reward_duration = 100;
    let reward_info: &mut RewardInfo = &mut quarry.reward_infos[reward_index];

    reward_info.init_reward(
        Pubkey::new_unique(),
        Pubkey::new_unique(),
        Pubkey::new_unique(),
        reward_duration,
    );

    // fund rewards
    let funding_amount = 200_000;
    reward_info
        .update_rate_after_funding(current_time as u64, funding_amount)
        .unwrap();

    // user claim
    let current_time = current_time + reward_duration as i64;
    quarry
        .update_rewards_and_miner(&mut miner_1, &rewarder, current_time)
        .unwrap();
    quarry
        .update_rewards_and_miner(&mut miner_2, &rewarder, current_time)
        .unwrap();

    assert_eq!(
        miner_1.reward_infos[reward_index].reward_pending,
        funding_amount / 2
    );
    assert_eq!(
        miner_2.reward_infos[reward_index].reward_pending,
        funding_amount / 2
    );
}

#[test]
fn test_two_reward_index() {
    let mut quarry = Quarry::default();
    let rewarder = Rewarder::default();
    let mut miner = Miner::default();

    //stake
    let current_time = 100;
    let amount = 100_000;
    quarry
        .process_stake_action_internal(
            StakeAction::Stake,
            current_time,
            &rewarder,
            &mut miner,
            amount,
        )
        .unwrap();

    assert_eq!(quarry.total_tokens_deposited, amount);
    // init reward
    let reward_index_1 = 0;
    let reward_index_2 = 1;
    let reward_duration = 100;
    let funding_amount_1 = 200_000;
    let funding_amount_2 = 300_000;
    {
        let reward_info_1: &mut RewardInfo = &mut quarry.reward_infos[reward_index_1];
        reward_info_1.init_reward(
            Pubkey::new_unique(),
            Pubkey::new_unique(),
            Pubkey::new_unique(),
            reward_duration,
        );
        // fund rewards

        reward_info_1
            .update_rate_after_funding(current_time as u64, funding_amount_1)
            .unwrap();
    }
    {
        let reward_info_2: &mut RewardInfo = &mut quarry.reward_infos[reward_index_2];
        reward_info_2.init_reward(
            Pubkey::new_unique(),
            Pubkey::new_unique(),
            Pubkey::new_unique(),
            reward_duration,
        );
        reward_info_2
            .update_rate_after_funding(current_time as u64, funding_amount_2)
            .unwrap();
    }

    // user claim
    let current_time = current_time + reward_duration as i64;
    quarry
        .update_rewards_and_miner(&mut miner, &rewarder, current_time)
        .unwrap();

    assert_eq!(
        miner.reward_infos[reward_index_1].reward_pending,
        funding_amount_1
    );
    assert_eq!(
        miner.reward_infos[reward_index_2].reward_pending,
        funding_amount_2
    );
}
