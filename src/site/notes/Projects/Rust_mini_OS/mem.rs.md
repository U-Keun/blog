---
{"tags":["Code","OS","Rust"],"sticker":"lucide//code-2","dg-publish":true,"permalink":"/projects/rust-mini-os/mem-rs/","dgPassFrontmatter":true}
---

커널 전체에서 공통으로 사용하는, 바이트 슬라이스(`&mut [u8]`, `&[u8]`) 단위의 저수준 메모리 조작 유틸 모듈이다. 상위 레벨에서는 가능한 한 `Page`, `Frame`, `Buf` 같은 의미 있는 타입을 쓰고, 그 타입들이 내부에서 실제 바이트를 만져야 할 때 `mem` 모듈의 함수를 호출하도록 만들었다. 

Rust 라이브러리로 동작하는 함수들이 많은데, 반복적으로 쓰이는 패턴을 모아두기 위해 모듈을 새로 만들었다.

```rust
#[inline]
pub fn fill(buf: &mut [u8], byte: u8) {
    buf.fill(byte);
}

#[inline]
pub fn zero(buf: &mut [u8]) {
    fill(buf, 0);
}
```
슬라이스 전체를 `byte` 값으로 채우는 함수와 전부 0으로 채우는 함수이다.

```rust
#[inline]
pub fn copy_from(dst: &mut [u8], src: &[u8]) {
    assert!(dst.len() >= src.len());
    dst[..src.len()].copy_from_slice(src);
}
```
`src` 전체를 `dst`의 앞부분으로 복사하는 함수이다. 

```rust
#[inline]
pub fn move_overlap(buf: &mut [u8], src: Range<usize>, dst_start: usize) {
    let len = src.end - src.start;
    assert!(src.end <= buf.len());
    assert!(dst_start + len <= buf.len());

    if dst_start > src.start {
        for i in (0..len).rev() {
            buf[dst_start + i] = buf[src.start + i];
        }
    } else {
        for i in 0..len {
            buf[dst_start + i] = buf[src.start + i];
        }
    }
}
```
같은 `buf` 내에서 `src` 구간을 `dst_start`로 이동시킨다. 페이지 테이블 내 엔트리 재배치나 슬라이스 안 버퍼 이동 등에서 사용할 수 있다. `assert` 문에 들어 있는 내용은, 인덱스가 버퍼 범위를 벗어나는 경우이다(그런 경우, 패닉을 일으키도록 작성해두었다).

옮기고자 하는 위치가 뒤쪽인 경우에는 거꾸로 값을 복사해서 넣어야 값이 깨지지 않는다는 것을 기억하자.