use anyhow::Error;
use anyhow::Result;
use serde::Deserialize;
use solana_program::example_mocks::solana_sdk::Pubkey;
use std::collections::HashMap;
use std::fs::File;
use std::io::Read;
use std::str::FromStr;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct TokenAllocation {
    pub authority: String,
    pub amount: String,
}
#[derive(Debug)]
pub struct MerkleTree(pub HashMap<u64, Vec<[u8; 32]>>);
impl MerkleTree {
    pub fn get_root(&self) -> [u8; 32] {
        let root_index = self.0.len() as u64 - 1;
        let root = self.0.get(&root_index).unwrap();
        return root[0];
    }
    pub fn find_proof(&self, index: u64) -> Vec<[u8; 32]> {
        let mut proof = vec![];
        let layer_length = self.0.len();
        let mut current_index = index;
        for i in 0..(layer_length - 1) {
            let current_layer = self.0.get(&(i as u64)).unwrap();
            // find adjacent in this layer

            let adjacent_index = if current_index % 2 == 0 {
                if current_index + 1 >= current_layer.len() as u64 {
                    current_index
                } else {
                    current_index + 1
                }
            } else {
                current_index - 1
            };
            if adjacent_index != current_index {
                proof.push(current_layer[adjacent_index as usize]);
            }

            current_index = current_index / 2;

            // update current index in this layer
        }
        return proof;
    }
}
#[derive(Debug)]
pub struct Snapshot(pub Vec<TokenAllocation>);
impl Snapshot {
    pub fn build_merkle_tree(&self) -> MerkleTree {
        let mut tree: HashMap<u64, Vec<[u8; 32]>> = HashMap::new();
        let mut first_branch = vec![];
        for (i, allocation) in self.0.iter().enumerate() {
            let claimant_account = Pubkey::from_str(&allocation.authority).unwrap();
            let amount = u64::from_str(&allocation.amount).unwrap();
            first_branch.push(
                anchor_lang::solana_program::keccak::hashv(&[
                    &i.to_le_bytes(),
                    &claimant_account.to_bytes(),
                    &amount.to_le_bytes(),
                ])
                .to_bytes(),
            );
        }
        tree.insert(0, first_branch.clone());
        //recursive to get all layers
        let mut layer_index = self.0.len();
        let mut index = 1;
        while layer_index > 0 {
            let mut child_branch = vec![];
            for i in 0..(layer_index / 2 + 1) {
                if 2 * i + 1 < first_branch.len() {
                    child_branch.push(
                        anchor_lang::solana_program::keccak::hashv(&[
                            &first_branch[2 * i],
                            &first_branch[2 * i + 1],
                        ])
                        .to_bytes(),
                    );
                } else {
                    child_branch.push(first_branch[2 * i]);
                }
            }

            tree.insert(index, child_branch.clone());
            first_branch = child_branch;

            layer_index = layer_index / 2;
            index += 1;
        }
        return MerkleTree(tree);
    }
    pub fn get_root(&self) -> [u8; 32] {
        let tree = self.build_merkle_tree();
        return tree.get_root();
    }
    //let (index, _amount, _proof)
    pub fn get_user_claim_info(&self, user: Pubkey) -> Result<(u64, u64, Vec<[u8; 32]>)> {
        let tree = self.build_merkle_tree();
        let mut user_index = 0u64;
        let mut amount = 0u64;
        let mut is_find = false;
        for (i, allocation) in self.0.iter().enumerate() {
            if allocation.authority == user.to_string() {
                is_find = true;
                amount = u64::from_str(&allocation.amount).unwrap();
                user_index = i as u64;
                break;
            }
        }
        if !is_find {
            return Err(Error::msg("Cannot find user"));
        }

        let proof = tree.find_proof(user_index);

        return Ok((user_index, amount, proof));
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

#[cfg(test)]
mod merkle_tree_test {
    use super::*;
    use std::env;
    #[test]
    fn test_get_root() {
        let current_dir = env::current_dir().unwrap();
        let snapshot = read_snapshot(
            format!(
                "{}/src/test_snapshot.json",
                current_dir.into_os_string().into_string().unwrap()
            )
            .to_string(),
        );
        let root = snapshot.get_root();
        println!("{:?}", root);
    }

    #[test]
    fn test_get_proof() {
        let current_dir = env::current_dir().unwrap();
        let snapshot = read_snapshot(
            format!(
                "{}/src/test_snapshot.json",
                current_dir.into_os_string().into_string().unwrap()
            )
            .to_string(),
        );
        for allocation in snapshot.0.iter() {
            let (index, _amount, proof) = snapshot
                .get_user_claim_info(Pubkey::from_str(&allocation.authority).unwrap())
                .unwrap();
            println!("index {} {:?} \n", index, proof);
        }
    }
}
