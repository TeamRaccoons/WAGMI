use anyhow::Result;
use serde::Deserialize;
use solana_program::example_mocks::solana_sdk::Pubkey;
use std::fs::File;
use std::io::Read;
use std::str::FromStr;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct TokenAllocation {
    pub authority: String,
    pub amount: String,
}

pub struct Snapshot(pub Vec<TokenAllocation>);
impl Snapshot {
    pub fn get_root(&self) -> [u8; 32] {
        panic!("implement here")
    }
    pub fn get_user_claim_info(&self, user: Pubkey) -> Result<(u64, u64, Vec<[u8; 32]>)> {
        panic!("implement here")
    }
}

pub fn read_snapshot(path_to_snapshot: String) -> Snapshot {
    let mut file = File::open(&path_to_snapshot).unwrap();
    let mut data = String::new();
    file.read_to_string(&mut data).unwrap();

    let list: Vec<TokenAllocation> =
        serde_json::from_str(&data).expect("JSON was not well-formatted");
    return Snapshot(list);
}

// let (max_num_nodes, max_total_claim, root) = buildTree(&snapshot);
pub fn build_tree(snapshot: &Snapshot) -> (u64, u64, [u8; 32]) {
    let max_num_nodes = snapshot.0.len();
    let mut max_total_claim = 0u64;
    for token_allocation in snapshot.0.iter() {
        let amount = u64::from_str(&token_allocation.amount).unwrap();
        max_total_claim = max_total_claim.checked_add(amount).unwrap();
    }
    return (max_num_nodes as u64, max_total_claim, snapshot.get_root());
}
