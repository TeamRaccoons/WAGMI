use anchor_lang::solana_program::hash::hashv;
use anyhow::Error;
use anyhow::Result;
use merkle_distributor::LEAF_PREFIX;
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
#[derive(Debug)]
pub struct MerkleTree {
    pub tree: Vec<Vec<[u8; 32]>>,
    pub first_branch: Vec<[u8; 32]>,
}
impl MerkleTree {
    pub fn get_root(&self) -> [u8; 32] {
        return self.tree[self.tree.len() - 1][0];
    }
    pub fn find_proof(&self, hash: [u8; 32]) -> Vec<[u8; 32]> {
        let mut proof = vec![];
        // let mut idx = index;
        let mut idx: u64 = 0;
        for (i, val) in self.first_branch.iter().enumerate() {
            if *val == hash {
                idx = i as u64;
                break;
            }
        }
        for (i, layer) in self.tree.iter().enumerate() {
            let pair_element = get_pair_element(idx, layer);

            // if (pairElement)
            if pair_element != None {
                let pair_element = pair_element.unwrap();
                proof.push(pair_element);
            }

            // }

            idx = idx / 2;
        }
        return proof;
    }
}

pub fn get_pair_element(idx: u64, layer: &Vec<[u8; 32]>) -> Option<[u8; 32]> {
    let pair_id = if idx % 2 == 0 { idx + 1 } else { idx - 1 };
    if pair_id > (layer.len() - 1) as u64 {
        return None;
    }
    return Some(layer[pair_id as usize]);
}

pub fn get_next_layer(next_layer: Vec<[u8; 32]>) -> Vec<[u8; 32]> {
    let mut layers: Vec<[u8; 32]> = vec![];
    for (i, val) in next_layer.iter().enumerate() {
        if i % 2 == 0 {
            if i == next_layer.len() - 1 {
                layers.push(val.clone());
            } else {
                layers.push(combine_hash(val.clone(), next_layer[i + 1].clone()));
            }
        }
    }
    return layers;
}

pub fn combine_hash(first: [u8; 32], second: [u8; 32]) -> [u8; 32] {
    if first <= second {
        hashv(&[&[1u8], &first, &second]).to_bytes()
    } else {
        hashv(&[&[1u8], &second, &first]).to_bytes()
    }
}
#[derive(Debug)]
pub struct Snapshot(pub Vec<TokenAllocation>);
impl Snapshot {
    pub fn build_merkle_tree(&self) -> MerkleTree {
        let mut tree: Vec<Vec<[u8; 32]>> = vec![];

        let mut first_branch = vec![];
        for (i, allocation) in self.0.iter().enumerate() {
            let claimant_account = Pubkey::from_str(&allocation.authority).unwrap();
            let amount = u64::from_str(&allocation.amount).unwrap();

            let node = hashv(&[
                &(i as u64).to_le_bytes(),
                &claimant_account.to_bytes(),
                &amount.to_le_bytes(),
            ]);
            let hash = hashv(&[LEAF_PREFIX, &node.to_bytes()]).to_bytes();

            first_branch.push(hash);
        }
        // sort
        first_branch.sort_by(|a, b| a.partial_cmp(b).unwrap());

        tree.push(first_branch.clone());
        while tree[tree.len() - 1].len() > 1 {
            let next_layer = tree[tree.len() - 1].clone();
            tree.push(get_next_layer(next_layer))
        }
        return MerkleTree { tree, first_branch };
    }
    pub fn get_root(&self) -> [u8; 32] {
        let tree = self.build_merkle_tree();
        return tree.get_root();
    }
    pub fn get_user_claim_info(&self, user: Pubkey) -> Result<(u64, u64, Vec<[u8; 32]>)> {
        let tree = self.build_merkle_tree();
        let mut user_index: u64 = 0;
        let mut amount = 0u64;
        let mut is_find = false;
        let mut hash: [u8; 32] = [0; 32];
        for (i, allocation) in self.0.iter().enumerate() {
            if allocation.authority == user.to_string() {
                is_find = true;
                amount = u64::from_str(&allocation.amount).unwrap();
                let claimant_account = Pubkey::from_str(&allocation.authority).unwrap();
                user_index = i as u64;
                let node = hashv(&[
                    &user_index.to_le_bytes(),
                    &claimant_account.to_bytes(),
                    &amount.to_le_bytes(),
                ]);
                hash = hashv(&[LEAF_PREFIX, &node.to_bytes()]).to_bytes();
                break;
            }
        }
        if !is_find {
            return Err(Error::msg("Cannot find user"));
        }

        let proof = tree.find_proof(hash);

        return Ok((user_index, amount, proof));
    }
}

pub fn read_snapshot(path_to_snapshot: String) -> Snapshot {
    let mut file = File::open(&path_to_snapshot).unwrap();
    let mut data = String::new();
    file.read_to_string(&mut data).unwrap();

    let list: Vec<TokenAllocation> =
        serde_json::from_str(&data).expect("JSON was not well-formatted");

    // make sure we dont have duplicate account
    for (index, item) in list.iter().enumerate() {
        for j in (index + 1..list.len()) {
            if item.authority == list[j].authority {
                panic!("duplicate authority");
            }
        }
    }
    return Snapshot(list);
}

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
    fn test_hash() {
        let index = 1u64;
        let claimant_account =
            Pubkey::from_str("smaK3fwkA7ubbxEhsimp1iqPTzfS4MBsNL77QLABZP6").unwrap();
        let amount = 100u64;
        // Verify the merkle proof.
        let node = hashv(&[
            &index.to_le_bytes(),
            &claimant_account.as_ref(),
            &amount.to_le_bytes(),
        ]);

        // [218, 23, 3, 242, 228, 60, 99, 142, 58, 181, 89, 42, 191, 34, 83, 206, 203, 159, 114, 184, 38, 27, 159, 15, 141, 230, 95, 87, 69, 210, 96, 246]
        println!("{:?}", node.to_bytes());

        let node = hashv(&[LEAF_PREFIX, &node.to_bytes()]);

        // [248, 208, 112, 90, 193, 59, 124, 34, 13, 180, 140, 59, 69, 0, 249, 121, 194, 99, 15, 37, 58, 87, 127, 119, 232, 73, 62, 85, 52, 213, 212, 216]
        println!("{:?}", node.to_bytes())
    }

    #[test]
    fn test_get_root() {
        let current_dir = env::current_dir().unwrap();
        let snapshot = read_snapshot(
            format!(
                "{}/src/snapshot.json",
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
                "{}/src/snapshot.json",
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
