extern crate geodate;

use std::os::raw::c_char;
use std::ffi::CString;
use geodate::geodate::get_date;

fn main() { // FIXME: remove main()
    println!("geodate loaded");
}

#[no_mangle]
pub fn geodate(timestamp: i32, longitude: f32) -> *mut c_char {
    let date = get_date(timestamp as i64, longitude as f64);

    CString::new(date).unwrap().into_raw()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_returns_a_geodate() {
        assert_eq!("00:69:11:22:99:75", get_date(0, 0.0));
        assert_eq!("01:14:05:24:15:42", get_date(1403322675, -1.826189));
    }
}
