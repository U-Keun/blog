---
{"sticker":"lucide//clipboard-check","dg-publish":true,"tags":["Docs","OS","Rust"],"permalink":"/projects/rust-mini-os/readme/","dgPassFrontmatter":true,"noteIcon":""}
---

프로젝트명 : Rust Mini OS on RISC-V
GitHub : [https://github.com/U-Keun/rust-mini-os](https://github.com/U-Keun/rust-mini-os)

![os_sketch.png](/img/user/Resources/os_sketch.png)
**요약**
RISC-V 환경에서 동작하는 OS 커널을 Rust(`no_std`)로 직접 구현한 프로젝트입니다.

부트 코드와 링크 스크립트부터 시작해, 트랩/예외 처리, CSR 유틸리티, SBI 연동, 커널 콘솔, 패닉 핸들러, 기본 런타임, 그리고 간단한 프로세스/스케줄러 및 컨텍스트 스위칭까지 구현했습니다.

실제로 부팅 가능한 커널을 작성하고 내부 동작을 코드 단위로 체험하는 것이 기본적인 목표였습니다.

---
# 기술 스택
- 언어: Rust (no_std), 일부 RISC-V inline assembly
- 아키텍처: RISC-V (QEMU virt 보드), OpenSBI
- 빌드 도구: Cargo, rustup, RISC-V 타겟 툴체인, Makefile
- 기타: 커스텀 링크 스크립트(ld), 커널 로그 기반 디버깅

---
# 프로젝트 목표
1. 최소한의 커널 라이프사이클 직접 구현
    - 부트 → 커널 진입 → 초기화 → 트랩/예외 처리 → 패닉/대기까지의 흐름 구현하기
2. CPU·메모리·특권 모드에 대한 이해를 코드 레벨로 끌어올리기
    - CSR, 예외 모델, SBI, 스택/링크 스크립트 등을 직접 다뤄보기
3. Rust를 이용한 시스템 프로그래밍 연습
    - `no_std` 환경, `panic_handler`, `unsafe`, inline asm 등을 실제로 사용해보기
---
# 주요 구현 내용
## 1. 부트 & 메모리 레이아웃 설계
- 커널이 메모리 어디에 올라가는지, 스택과 BSS, free RAM이 어떻게 배치되는지를 ****링크 스크립트로 명시적으로 설계
    - 커널 베이스 주소: `0x8020_0000`
    - `.text`, `.rodata`, `.data`, `.bss` 순으로 섹션 배치
    - BSS 영역의 시작/끝 심볼(`__bss`, `__bss_end`) 정의
    - 커널 스택 상단 심볼(`__stack_top`)과 free RAM 영역(`__free_ram`, `__free_ram_end`) 지정

>[!NOTE] 커널 코드와 데이터가 물리 메모리 어디에 놓이는지를 직접 설계하면서, 이후 페이지 테이블/메모리 할당기를 어떻게 추가할 수 있을지 고민 중입니다.
## 2. CSR 유틸리티 및 트랩/예외 처리

### (1) CSR 접근 매크로
- `scause`, `stval`, `sepc`, `sstatus` 등 CSR 읽기/쓰기 함수를 매크로로 정의
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
    - `def_read_csr!(read_scause, scause);`
    - `def_read_csr!(read_stval, stval);`
    - `def_read_csr!(read_sepc, sepc);`
    - `def_write_csr!(write_sscratch, sscratch);` 등

>[!NOTE] CSR 사용 시 직접 어셈블리 문자열을 매번 작성하는 대신, 매크로로 패턴화하여 작성해보았습니다.
### (2) 트랩 프레임 및 예외 처리 흐름
트랩 발생 시 저장해야 하는 레지스터 집합을 `TrapFrame` 구조체로 정의
- 어셈블리 레벨 트랩 엔트리에서:
    1. 레지스터들을 `TrapFrame`에 저장
    2. 필요한 경우 커널 스택으로 전환
    3. Rust로 작성된 `rust_trap_handler()`로 제어를 넘김
- `rust_trap_handler()`에서는:
    1. `scause`를 읽어 예외/인터럽트 원인을 판별
    2. `stval`, `sepc`를 이용해 “어떤 주소/명령에서 문제가 났는지” 로그 출력
    3. 회복 불가능한 경우 `panic!`을 호출하여 커널 패닉 경로로 전환

>[!NOTE] “예외가 나면 커널이 처리한다”는 추상적인 설명이 아니라, **CSR → 트랩 엔트리 → 트랩 프레임 저장 → Rust 핸들러 → 복구/정지**라는 구체적인 흐름을 직접 설계·구현해보았습니다.
## 3. SBI 연동 및 커널 런타임
### (1) SBI 호출 래퍼
OpenSBI와 커널을 연결하는 래퍼 모듈을 구성
- 공용 리턴 타입 `SbiRet { error: isize, value: isize }`
- `sbi_call(eid, fid, arg0..arg5)` 함수
    - RISC-V의 `a0~a7` 레지스터에 인자를 설정하고, `ecall` 명령으로 SBI 호출
	→ 콘솔 출력 함수(`sbi_putchar`)와 시스템 종료 함수(`system_reset`)등 고수준 함수 구현
### (2) `panic_handler` & `halt()`
- Rust의 `#[panic_handler]` 구현
    - 패닉 발생 시 `PanicInfo`에서 위치/메시지 추출
    - `kprintln!`으로 커널 콘솔에 출력한 뒤, `halt()` 호출
- `halt()`는 `wfi`(wait for interrupt)를 사용하여 불필요한 busy-wait 없이 CPU를 정지 상태로 유지
    ```rust
    #[inline(always)]
    pub fn halt() -> ! {
        loop {
            unsafe { core::arch::asm!("wfi", options(nomem, nostack)) }
        }
    }
    ```

>[!NOTE] “커널 패닉 → 메시지 출력 → CPU 정지”라는 종료 메커니즘을 갖추게 되었고, 런타임 처리와 하드웨어 명령(`wfi`)을 연결했습니다.
## 4. 커널 콘솔 & 동기화(스핀락)
커널 로그 출력과 디버깅을 위한 콘솔 모듈 구현
- `Spin` 구조체로 간단한 스핀락 구현:
    ```rust
    struct Spin(AtomicBool);
    
    impl Spin {
        const fn new() -> Self { Self(AtomicBool::new(false)) }
    
        fn lock(&self) {
            while self.0.swap(true, Ordering::Acquire) {}
        }
    
        fn unlock(&self) {
            self.0.store(false, Ordering::Release);
        }
    }
    ```
    전역 `static LOCK: Spin = Spin::new();` 로 콘솔 출력 보호:
    - `core::fmt::Write` 트레이트를 구현해서, `kprint!`, `kprintln!` 매크로로 일반 `println!` 스타일의 포맷 출력 지원
    - 실제 출력은 `sbi_putchar`를 통해 OpenSBI 콘솔로 전달

>[!NOTE] 단일 코어 환경에서도 공유 자원(콘솔)에 대한 최소한의 동기화 메커니즘을 추가했고, `Ordering` 모듈의 `Acquire` , `Release` 를 실제 코드에서 사용해 보았습니다.
## 5. 주소 타입 추상화 및 메모리 유틸

### (1) 주소 타입 추상화
메모리 주소를 단순한 `usize`로만 쓰지 않고, 타입 레벨에서 물리/가상 주소를 구분
```rust
#[derive(Copy, Clone, Eq, PartialEq, Ord, PartialOrd, Debug)]
pub struct PAddr(pub usize);

#[derive(Copy, Clone, Eq, PartialEq, Ord, PartialOrd, Debug)]
pub struct VAddr(pub usize);
```
- 공통 동작은 `Addr` 트레이트로 추상화:
    ```rust
    pub trait Addr: Copy + Eq + Ord {
        fn raw(self) -> usize;
        fn from_raw(x: usize) -> Self;
    
        #[inline]
        fn align_up(self, align: usize) -> Self {
            debug_assert!(align.is_power_of_two());
            let x = self.raw();
            let y = (x + align - 1) & !(align - 1);
            Self::from_raw(y)
        }
    
        #[inline]
        fn is_aligned(self, align: usize) -> bool {
            debug_assert!(align.is_power_of_two());
            (self.raw() & (align - 1)) == 0
        }
    }
    ```
    - `align_up`과 `is_aligned`는 페이지 경계 정렬 등에 사용 가능하도록 설계
### (2) 메모리 유틸 함수
실제 바이트 배열에 쓰기가 발생하는 지점을 한 곳으로 모으기 위해, 별도의 메모리 유틸리티 모듈을 두었습니다. 커널의 다른 코드에서는 이 함수들을 통해서만 버퍼를 수정하도록 사용하는 것을 목표로 했습니다.
```rust
use core::ops::Range;

#[inline]
pub fn fill(buf: &mut [u8], byte: u8) {
    buf.fill(byte);
}

#[inline]
pub fn zero(buf: &mut [u8]) {
    fill(buf, 0);
}

#[inline]
pub fn copy_from(dst: &mut [u8], src: &[u8]) {
    assert!(dst.len() >= src.len());
    dst[..src.len()].copy_from_slice(src);
}

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
- `fill`/`zero` 함수는 커널 내부의 `memset` 역할을 하고,
- `copy_from` 함수는 크기를 검사한 뒤 슬라이스 복사로 `memcpy`를 감쌉니다.
- `move_overlap` 함수는 겹치는 영역을 안전하게 이동시키기 위해, `memmove`와 동일한 패턴으로 앞/뒤 방향을 나눠 복사합니다.

>[!NOTE] 이 모듈은 실제로 메모리 내용이 바뀌는 곳을 하나의 레이어로 묶기 위한 용도로 작성했습니다. 커널의 다른 부분에서는 raw 포인터 대신 슬라이스 기반 인터페이스만 사용하면서, 필요하다면 이 레이어에만 추가 검사나 디버깅을 할 수 있도록 하는 것이 좋다고 생각했습니다.
## 6. 커널 프로세스 & 스케줄러, 컨텍스트 스위칭
커널 내부의 프로세스 모델과 스케줄러 구현
### (1) 프로세스 모델 (PCB)
- 최대 `PROCS_MAX = 8`개의 프로세스를 관리
- 각 프로세스는 `Process` 구조체로 표현:
    ```rust
    #[repr(C)]
    #[derive(Clone, Copy)]
    pub struct Process {
        pub pid: i32,
        pub state: State,             // Unused / Runnable
        pub sp: usize,                // 커널 스택 포인터
        // pub pt_root_phys: usize,   // 페이지 테이블 루트 (확장 대비)
        pub stack: [u8; KSTACK_SIZE], // 8KB 커널 전용 스택
    }
    ```
- 전역:
    - `static mut PROCS: [Process; PROCS_MAX]`
    - `pub static mut CURRENT: *mut Process`
    - `pub static mut IDLE: *mut Process`
- `alloc_pcb()`로 `State::Unused`인 PCB를 찾아 `pid`, `state`, `sp` 등을 초기화
### (2) 어셈블리 컨텍스트 스위칭 (switch_context)
컨텍스트 스위칭은 RISC-V 어셈블리로 구현
```nasm
switch_context:
    addi   sp, sp, -13*4
    sw     ra,   0*4(sp)
    sw     s0,   1*4(sp)
    ...
    sw     s11, 12*4(sp)

    sw     sp, 0(a0)    # *prev_sp = sp
    lw     sp, 0(a1)    # sp = *next_sp

    lw     ra,   0*4(sp)
    lw     s0,   1*4(sp)
    ...
    lw     s11, 12*4(sp)
    addi   sp, sp, 13*4
    ret
```
- RISC-V의 callee-saved 레지스터 `ra`, `s0..s11` 총 13개를 스택에 저장/복원
- 현재 스택 포인터를 `prev_sp`에 저장, 다음 프로세스의 스택 포인터를 `next_sp`에서 로드

>[!NOTE] 컨텍스트 스위칭이 실제로 어떤 레지스터/스택 조작으로 이루어지는지를 직접 구현하고 이해할 수 있었습니다.
### (3) 프로세스 생성 및 초기 스택 프레임
- `create_process(entry)` 호출 시:
    1. `alloc_pcb()`로 PCB 하나 할당
    2. `init_kernel_frame_and_sp(proc, entry)`로 커널 스택 상단에 초기 컨텍스트 프레임 구성
    ```rust
    unsafe fn init_kernel_frame_and_sp(proc: *mut Process, entry: Entry) {
        let stack_top = (&(*proc).stack as *const _ as usize) + KSTACK_SIZE;
        let frame_ptr = (stack_top - FRAME_BYTES) as *mut u32;
    
        // s0..s11 = 0
        for i in 0..CALLEE_SAVED_COUNT {
            core::ptr::write(frame_ptr.add(1 + i), 0);
        }
    
        // 저장된 ra 위치에 entry 주소 기록
        core::ptr::write(frame_ptr.add(0), entry as usize as u32);
    
        (*proc).sp = frame_ptr as usize;
    }
    ```

>[!NOTE] `switch_context` 에 의해 처음 이 프로세스로 전환될 때, 스택에 저장된 `ra` 레지스터를 복원하고 `ret` 을 호출하면, `entry()` 함수로 점프하는 구조입니다.
### (4) 라운드 로빈 스케줄러 + Idle 프로세스
기본 스케줄링 전략은 간단한 라운드 로빈(cooperative) 방식을 선택했습니다.
```rust
unsafe fn pick_next(current: *mut Process) -> *mut Process {
    if all_unused() { return IDLE; }

    let start = match current_index(current) {
        Some(idx) => (idx + 1) % PROCS_MAX,
        None => 0,
    };

    for step in 0..PROCS_MAX {
        let idx = (start + step) % PROCS_MAX;
        let p = proc_mut_at(idx);
        if (*p).state == State::Runnable && (*p).pid > 0 { return p; }
    }
    IDLE
}

pub unsafe fn yield_now() {
    let cur = CURRENT;
    let next = pick_next(cur);

    if !next.is_null() && next != cur {
        let ksp_top = (&(*next).stack as *const _ as usize) + KSTACK_SIZE;
        csr::write_sscratch(ksp_top as usize);

        let prev_sp_ptr: *mut usize = if cur.is_null() {
            core::ptr::addr_of_mut!(DUMMY_SP)
        } else {
            core::ptr::addr_of_mut!((*cur).sp)
        };

        CURRENT = next;
        switch_context(prev_sp_ptr, core::ptr::addr_of!((*next).sp));
    }
}
```
- `pick_next`에서 현재 인덱스 이후부터 순회하며 `State::Runnable`인 프로세스를 찾고, 없으면 `IDLE` 프로세스를 선택

>[!NOTE] 커널 내부에 여러 프로세스를 두고, `yield_now()`를 통해 문맥을 넘겨가며 실행하는 동작을 구현했습니다. 현재는 `sscratch`에 각 프로세스의 커널 스택 상단을 기록하는 설계를 넣어두었는데, 이것을 이용하여 타이머 인터럽트 기반 preemptive 스케줄러도 구현해 볼 예정입니다.

---
# 결과

QEMU 상의 RISC-V 가상 머신에서 OpenSBI를 통해 커널이 부팅된 뒤, 커널 스케줄러가 프로세스 A와 B를 번갈아 100회씩 실행하고, 설정된 조건(총 200회 출력)에 도달하면 SBI `system_reset`을 호출해 정상 종료하는 전체 흐름을 보여주는 화면입니다.
![os_execution.png|center](/img/user/Resources/os_execution.png)

---
# 배운 점 및 느낀 점
- 혼자 공부하며 접하던 추상적인 개념들을 코드 수준에서 더 구체적으로 이해할 수 있었습니다. 인터넷에서 흔히 보던 스택/힙 구조 이미지가 왜 그런 형태로 그려지는지, 컨텍스트 스위칭을 실제로 어디에서 제어하는지, 예외가 어떤 경로로 처리되는지 등을 직접 구현해 보면서, 이러한 개념들이 실제 코드에서는 CSR, 링크 스크립트, 스택 프레임, 어셈블리 명령의 조합으로 나타난다는 것을 확인했습니다.
- Rust의 `no_std` 환경에서 `panic_handler`, `unsafe`, inline asm API를 직접 사용해 보며, 일반 애플리케이션 개발과는 다른 시스템 프로그래밍의 제약과 자유도를 체감했습니다.
- 간단한 커널을 직접 만들어 보면서, 실제 세상에는 다양한 설계 철학과 목표를 가진 운영체제들이 존재한다는 것을 알게 되었고, 그중에서도 가장 널리 사용되는 리눅스 커널의 구조와 설계 의도를 더 깊이 이해할 필요성을 느꼈습니다. 이 프로젝트를 계기로, 앞으로는 다양한 커널 소스와 문서를 참고하며 현재 구현을 비교·확장해 보는 방향으로 공부를 이어가고자 합니다.

---
# 향후 확장 계획

현재는 “부트 → 트랩/예외 처리 → 커널 콘솔 출력 → 프로세스/스케줄러 → 패닉/대기”까지 구현된 상태이며, 다음과 같은 방향으로 확장을 계획 중입니다.

1. 디스크 I/O와 파일 시스템
    - 단순 블록 디바이스 드라이버를 구현하고, 그 위에 최소한의 파일 시스템 레이어를 올리는 것을 목표로 합니다.
2. 타이머 인터럽트 및 preemptive 스케줄러
    - 타이머 인터럽트 발생 시 트랩 핸들러에서 `yield_now()`를 호출하도록 연결해, 현재의 협력형(cooperative) 스케줄링을 preemptive 라운드 로빈으로 확장할 계획입니다.
3. 동적 메모리 할당기
    - 링크 스크립트에서 확보한 `__free_ram` ~ `__free_ram_end` 구간을 기반으로, 페이지 단위/힙 단위의 간단한 메모리 할당기를 구현할 계획입니다.
4. 유저 모드와 시스템 콜 레이어
    - `sstatus` 플래그를 이용해 사용자 모드와 커널 모드를 분리하고, 트랩을 통해 커널로 진입하는 시스템 콜 경로를 설계할 계획입니다.