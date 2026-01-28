---
{"sticker":"lucide//code-2","tags":["Code","OS","Rust"],"dg-publish":true,"permalink":"/areas/rust-mini-os/src/csr-rs/","dgPassFrontmatter":true}
---

RISC-V의 주요 Supervisor CSR(Control and Status Register)을 읽고 쓰는 커널 전용 유틸리티 모듈이다. 

먼저 매크로를 살펴보자.
```rust
macro_rules! def_read_csr {
    ($fn: ident, $csr: ident) => {
        #[inline]
        pub fn $fn() -> usize {
            let x: usize;
            unsafe { 
                core::arch::asm!(
                    concat!("csrr {0}, ", stringify!($csr)),
                    lateout(reg) x, 
                    options(nomem, nostack, preserves_flags)
                )
            }
            x
        }
    };
}
```
`csrr` 명령으로 특정 CSR을 읽는 함수를 생성할 수 있는 매크로이다. 함수 이름(`$fn`)과 CSR 이름(`$csr`)을 인자로 받고, CSR 이름은 명령으로 조합하여 반환값 `x`에 값을 채우도록 한다. 여기서 사용된 옵션은 다음과 같다:
- `nomem` : 메모리를 건드리지 않는다.
- `nostack` : 스택 프레임을 건드리지 않는다.
- `preserve_flags` : 플래그 레지스터는 보존된다.

위의 매크로로 아래와 같은 함수들을 만들어두었다.
```rust
def_read_csr!(read_scause, scause);
def_read_csr!(read_stval, stval);
def_read_csr!(read_sepc, sepc);
def_read_csr!(read_sstatus, sstatus);
```
트랩 핸들러/예외 처리에서 사용되는 함수들이다. 각 CSR 레지스터는 다음과 같은 의미를 가진다:
- `scause` : Supervisor Cause. 예외 발생 원인
- `stval` : Supervisor Trap Value. 추가 정보(주소 등)를 담는 레지스터
- `sepc` : Supervisor Exception Program Counter. 예외가 발생한 프로그램 카운터
- `sstatus` : Supervisor Status. Supervisor 모드의 상태 레지스터

위의 매크로와 비슷하게, CSR에 쓰기 작업을 수행하도록 하는 매크로도 작성해두었다.
```rust
macro_rules! def_write_csr {
    ($fn: ident, $csr: ident) => {
        #[inline]
        pub fn $fn(val: usize) {
            unsafe {
                core::arch::asm!(
                    concat!("csrw ", stringify!($csr), ", {0}"),
                    in(reg) val,
                    options(nomem, preserves_flags)
                )
            }
        }
    };
}
```
`csrw` 명령으로 특정 CSR을 쓰는 함수를 생성할 수 있는 매크로이다. 함수 이름과 CSR 이름을 사용하는 것은 위와 동일하고, `val`을 인자로 받아서 그것을 직접 레지스터에 쓰도록(`csrw`) 명령을 보낸다.

위의 매크로로 아래와 같은 함수를 만들어두었다.
```rust
def_write_csr!(write_stvec, stvec);
def_write_csr!(write_sscratch, sscratch);
```
여기서 `stvec`는 트랩 핸들러 엔트리 포인트 주소를 설정하는 CSR이고, `sscratch`는 트랩 엔트리에서 임시로 쓰는 스택 포인터에서 사용되는 CSR이다.

따로 추가해둔 함수들도 있다.
```rust
#[inline]
pub fn write_satp(val: usize) {
    unsafe { core::arch::asm!("csrw satp, {}", in(reg) val, options(nostack, preserves_flags)) }
}

#[inline]
pub fn sfence_vma_all() {
    unsafe { core::arch::asm!("sfence.vma", options(nostack, preserves_flags)) }
}
```
`write_satp()` 함수는 페이지 테이블 루트/주소 공간 번호 등을 담는 CSR에 값을 쓰는 함수이고, `sfence_vma_all()` 함수는 모든 가상 주소/ASID에 대해 TLB/페이지 관련 캐시를 무효화하는 함수이다.