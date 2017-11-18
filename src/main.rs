extern crate geodate;

use std::os::raw::c_char;
use std::ffi::CString;
use geodate::geodate::get_date;
use geodate::sun_transit;

fn main() { // FIXME: remove main()
    println!("geodate loaded");
}

#[no_mangle]
pub fn geodate(timestamp: i32, longitude: f32) -> *mut c_char {
    let date = get_date(timestamp as i64, longitude as f64);

    CString::new(date).unwrap().into_raw()
}

#[no_mangle]
pub fn sunrise(timestamp: i32, longitude: f32, latitude: f32) -> i32 {
    if let Some(sunrise) = sun_transit::get_sunrise(timestamp as i64, longitude as f64, latitude as f64) {
        sunrise as i32
    } else {
        -1
    }
}

#[no_mangle]
pub fn sunset(timestamp: i32, longitude: f32, latitude: f32) -> i32 {
    if let Some(sunset) = sun_transit::get_sunset(timestamp as i64, longitude as f64, latitude as f64) {
        sunset as i32
    } else {
        -1
    }
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
