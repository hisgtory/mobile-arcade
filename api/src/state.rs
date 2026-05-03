use crate::jf::repo::VariantRepo;

#[derive(Clone)]
pub struct AppState {
    pub variants: VariantRepo,
}
