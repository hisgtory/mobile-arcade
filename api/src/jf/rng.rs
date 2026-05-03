use rand::rngs::StdRng;
use rand::{Rng, RngExt, SeedableRng};

pub fn from_entropy() -> StdRng {
    StdRng::from_rng(&mut rand::rng())
}

#[cfg(test)]
pub fn seeded(seed: u64) -> StdRng {
    StdRng::seed_from_u64(seed)
}

pub fn shuffle<T, R: Rng>(rng: &mut R, slice: &mut [T]) {
    for i in (1..slice.len()).rev() {
        let j: usize = rng.random_range(0..=i);
        slice.swap(i, j);
    }
}
