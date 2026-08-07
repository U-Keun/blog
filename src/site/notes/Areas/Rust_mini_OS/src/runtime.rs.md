---
{"sticker":"lucide//code-2","tags":["Code","OS","Rust"],"dg-publish":true,"permalink":"/areas/rust-mini-os/src/runtime-rs/","dgPassFrontmatter":true,"dg-note-properties":{"sticker":"lucide//code-2","tags":["Code","OS","Rust"]}}
---

부팅이 완료된 이후 커널의 실행 상태를 제어하는 함수들을 추가할 모듈이다. 현재는 `halt()` 함수만 추가되어 있다.

```rust
#[inline(always)]
pub fn halt() -> ! {
    loop {
        unsafe { core::arch::asm!("wfi", options(nomem, nostack)) }
    }
}
```
RISC-V 명령어 `wfi`(Wait For Interrupt)를 무한루프로 실행한다.