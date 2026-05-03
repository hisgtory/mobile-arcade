use super::Shape;

pub fn is_inside_shape(shape: Shape, c: u32, r: u32, total_cols: u32, total_rows: u32) -> bool {
    let denom_c = (total_cols.max(2) - 1) as f32;
    let denom_r = (total_rows.max(2) - 1) as f32;
    let x = c as f32 / denom_c;
    let y = r as f32 / denom_r;
    let dx = x - 0.5;
    let dy = y - 0.5;

    match shape {
        Shape::Heart => {
            let hx = dx * 2.2;
            let hy = -dy * 2.2 + 0.2;
            let lhs = (hx * hx + hy * hy - 1.0).powi(3) - hx * hx * hy.powi(3);
            lhs <= 0.0
        }
        Shape::Diamond => dx.abs() + dy.abs() <= 0.5,
        Shape::Circle => dx * dx + dy * dy <= 0.25,
        Shape::Cross => dx.abs() <= 0.15 || dy.abs() <= 0.15,
        Shape::Rect => true,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rect_is_always_inside() {
        for c in 0..6 {
            for r in 0..8 {
                assert!(is_inside_shape(Shape::Rect, c, r, 6, 8));
            }
        }
    }

    #[test]
    fn diamond_corner_excluded_center_included() {
        assert!(!is_inside_shape(Shape::Diamond, 0, 0, 6, 8));
        assert!(is_inside_shape(Shape::Diamond, 3, 4, 6, 8));
    }

    #[test]
    fn circle_corner_excluded() {
        assert!(!is_inside_shape(Shape::Circle, 0, 0, 6, 8));
    }
}
