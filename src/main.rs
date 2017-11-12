extern crate geodate;

use std::os::raw::c_char;
use std::ffi::CString;
use geodate::geodate::*;

fn main() { // FIXME: remove main()
    println!("geodate loaded");
}

#[no_mangle]
pub fn geodate(timestamp: i32, longitude: f32) -> *mut c_char {
    let date = get_lunisolar_date(timestamp as i64, longitude as f64);

    CString::new(date).unwrap().into_raw()
}

#[cfg(test)]
mod tests {
    #[test]
    fn it_returns_a_geodate() {
        assert_eq!(geodate(1403322675, -1.826189), "44:05:24:15:42".into());
    }
}
