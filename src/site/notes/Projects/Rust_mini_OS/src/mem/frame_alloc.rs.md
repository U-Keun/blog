---
{"tags":["Code","OS","Rust"],"dg-publish":true,"sticker":"lucide//code-2","permalink":"/projects/rust-mini-os/src/mem/frame-alloc-rs/","dgPassFrontmatter":true,"noteIcon":""}
---

커널이 쓰고 남은 "free RAM" 구간 `[__free_ram .. __free_ram_end)`에서 페이지를 연속으로 할당하는 모듈이다.

```rust
unsafe extern "C" {
    static __free_ram: u8;
    static __free_ram_end: u8;
}
```
링커 심볼을 받아오는 부분이다. `__free_ram`은 커널이 점유한 뒤 남는 RAM의 시작 주소이고, `__free_ram_end`는 남는 RAM의 끝 주소이다. 주소를 얻을 때는, `&symbol as *const u8 as usize`로 정수 주소를 얻는다.

```rust
static NEXT: AtomicUsize = AtomicUsize::new(0);
static LIMIT: AtomicUsize = AtomicUsize::new(0);

pub fn init() {
    let start = unsafe { &__free_ram as *const u8 as usize };
    let end = unsafe { &__free_ram_end as *const u8 as usize };
    let start = align_up(start, PAGE_SIZE);
    NEXT.store(start, Ordering::Relaxed);
    LIMIT.store(end, Ordering::Relaxed);
}
```
전역 상태로 `NEXT`와 `LIMIT`을 두고, `init()` 함수에서 페이지 경계를 정렬하고, 값을 설정한다. `init()` 함수는 뒤에 나올 `alloc_pages()` 함수가 호출되기 전에 반드시 한 번은 실행되어야 한다.
>[!NOTE] `NEXT`, `LIMIT`의 타입은 원자적 연산을 안정적으로 쓰기 위함이다. `AtomicPAddr` 같은 래퍼를 만드는 것이 더 좋을까?

```rust
#[derive(Debug, Clone, Copy)]
pub struct Oom;
```
할당 불가(Out-of-memory) 상황을 나타내는 최소 에러 타입이다.

```rust
#[derive(Debug, Clone, Copy)]
pub struct PageFrame {
    paddr: PAddr,
}
```
`PageFrame`은 연속 페이지 블록의 시작 [[Projects/Rust_mini_OS/src/mem/addr.rs\|물리 주소]]를 담는다.

```rust
impl PageFrame {
    #[inline] pub fn paddr(self) -> PAddr { self.paddr }

    pub unsafe fn as_bytes_mut_static(self, n_pages: usize) -> &'static mut [u8] {
        let len = n_pages * PAGE_SIZE;
        unsafe { core::slice::from_raw_parts_mut(self.paddr.raw() as *mut u8, len) }
    }

    pub unsafe fn fill(self, n_pages: usize, byte: u8) {
        let len = n_pages * PAGE_SIZE;
        unsafe { core::ptr::write_bytes(self.paddr.raw() as *mut u8, byte, len); }
    }
}
```
물리 주소 값에 접근하거나, raw 메모리에 접근하거나, 지정 범위를 `byte` 값으로 채우는 함수들을 가지고 있다. 인자로 주어지는 값들에 대해서, 호출자의 책임이 커서, 일단은 `unsafe`로 적어두었다.

```rust
pub fn alloc_pages(n: usize) -> Result<PageFrame, Oom> {
    let bytes = n.checked_mul(PAGE_SIZE).ok_or(Oom)?;

    loop {
        let cur = NEXT.load(Ordering::Relaxed);
        let end = LIMIT.load(Ordering::Relaxed);
        let new_ = cur.checked_add(bytes).ok_or(Oom)?;
        if new_ > end { return Err(Oom); }

        if NEXT.compare_exchange_weak(cur, new_, Ordering::AcqRel, Ordering::Relaxed).is_ok() {
            unsafe { core::ptr::write_bytes(cur as *mut u8, 0, bytes); }
            return Ok(PageFrame { paddr: PAddr(cur) });
        }
    }
}
```
이 함수에서는 `n`개의 페이지를 할당한다. 오버플로우나 범위를 체크하고, `compare_exchange_weak` 함수[^1]로 할당할 수 있는 구간을 확보한다. 구간이 확보되면, 해당 범위를 `0`으로 채운 뒤 `PageFrame { paddr: PAddr(cur) }`를 반환한다.
>[!NOTE] 아직은 할당 해제도 없고, 공유 상태가 `NEXT` 하나라서, 위의 구현은 아직 명시적이기만 하다. 

[^1]: `weak`가 붙은 함수는 '이유 없이 실패(spurious failure)'가 가능하므로, 루프에서 재시도 하는 패턴이 정석이다. 