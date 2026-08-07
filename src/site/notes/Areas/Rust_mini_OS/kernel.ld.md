---
{"tags":["Code","OS"],"sticker":"lucide//code-2","dg-publish":true,"permalink":"/areas/rust-mini-os/kernel-ld/","dgPassFrontmatter":true,"dg-note-properties":{"tags":["Code","OS"],"sticker":"lucide//code-2"}}
---

```ld
ENTRY(boot)

SECTIONS {
    . = 0x80200000;
    __kernel_base = .;

    .text : { 
        KEEP(*(.text.boot)); 
        *(.text .text.*) 
    }

    .rodata : ALIGN(4) { 
        *(.rodata .rodata.*) 
    }

    .data : ALIGN(4) { 
        *(.data .data.*) 
    }

    .bss : ALIGN(4) { 
        __bss = .;
        *(.bss .bss.* .sbss .sbss.*);
        __bss_end = .;
    }

    . = ALIGN(4);
    . += 128 * 1024; /* 128KB */
    __stack_top = .;

    . = ALIGN(4096);
    __free_ram = .;
    . += 64 * 1024 * 1024;
    __free_ram_end = .;
}
```
위의 스크립트는 빌드 시, 커널 바이너리가 메모리에 어떻게 배치되는지와 부트 코드가 참조할 중요한 심볼들(엔트리, BSS 범위, 스택, 힙 시작/끝)을 정의한다. ELF[^1] 배치를 결정한다고 말하기도 한다. 이 스크립트를 꼼꼼히 살펴보자.
## `ENTRY(boot)`
완성된 ELF의 엔트리 포인트 심볼을 지정하는 부분으로[^2], 여기서는 `boot`라는 이름으로 지정되어 있고, `main.rs` 파일에 있는 아래의 코드로 해당 심볼이 정의된다.
```rust
global_asm!(r#"
.section .text.boot
.global boot              # boot를 전역 심볼로 노출(링커가 참조할 수 있도록)
.align 2                  # 4-byte 정렬
boot:
    la  sp, __stack_top   # 링커가 만든 절대주소(__stack_top)를 sp로 로드
    j   kernel_main       # kernel_main으로 무조건 분기
"#);
```
OpenSBI가 커널 ELF를 로드하고, `boot` 라벨 주소로 점프하여 위 두 명령이 실행된다.
## `SECTIONS { ... }`
입력 오브젝트 파일들(.o)에 흩어져 있는 섹션들을, 최종 ELF 파일에 어떻게 배치할지 결정하는 부분이다.

```ld
. = 0x80200000;
__kernel_base = .;
```
출력 바이너리에서 현재 쓰고 있는 주소(`.`)를 `0x8020_0000`으로 설정하고, 그 위치를 `__kernel_base` 심볼에 저장한다. 커널이 이 주소 `0x8020_0000`에 놓일 것이다.

```ld
.text : { 
	KEEP(*(.text.boot)); 
	*(.text .text.*) 
}
```
ELF의 `.text` 출력 섹션을 만드는 부분이다. 각 오브젝트 파일에 있는 `.text.boot` 섹션들을 전부 넣는다. `KEEP`은 해당 섹션은 버리지 말라는 의미로, 부트 진입 코드가 이곳에 들어간다. 이외의 일반 코드들도 `.text` 또는 `.text.*` 섹션에 포함된다.

```ld
.rodata : ALIGN(4) { 
	*(.rodata .rodata.*) 
}

.data : ALIGN(4) { 
	*(.data .data.*) 
}
```
ELF의 `.rodata` 및 `.data` 섹션을 만들고, 시작 주소를 4바이트 정렬시킨다.[^3] 이곳에는 각각 읽기 전용 데이터와 0이 아닌 초기값이 있는 대부분의 전역/정적 데이터가 들어간다.

```ld
.bss : ALIGN(4) { 
	__bss = .;
	*(.bss .bss.* .sbss .sbss.*);
	__bss_end = .;
}
```
`.rodata`나 `.data`와 같이 데이터를 넣는 섹션을 만드는 부분이다. 여기에는 0으로 초기화될 전역/정적 데이터가 들어간다. 여기에는 데이터의 크기만 기록하고, 실행 시 0으로 채우는 변수들을 다루는 부분이다.

```ld
. = ALIGN(4);
. += 128 * 1024; /* 128KB */
__stack_top = .;
```
현재 주소(`.`)를 4바이트 정렬한 뒤 128KB만큼 앞으로 이동시켜서 스택으로 사용할 주소 범위를 예약한다. `__stack_top` 심볼은 이 범위의 끝 주소를 나타내고, `la sp, __stack_top` 명령에서 이 위치를 스택 포인터로 설정하여 사용한다.

```ld
. = ALIGN(4096);
__free_ram = .;
. += 64 * 1024 * 1024;
__free_ram_end = .;
```
현재 주소를 4KB(페이지 크기) 경계로 정렬한 뒤[^4], 이 위치부터 64MB 만큼을 커널이 자유롭게 쓸 수 있는 RAM으로 설정하는 부분이다. `__free_ram`, `__free_ram_end` 심볼은 각각 RAM의 시작 주소와 끝 주소이다.

[^1]: Executable and Linkable Format. Linux/Unix 계열 시스템에서 사용하는 여러 종류의 바이너리 파일(실행 파일, 오브젝트 파일, 공유 라이브러리, 코어 덤프 등)을 표현하는 파일 포맷.
[^2]: ELF 헤더의 `e_entry` 필드에 `boot`의 주소가 들어간다
[^3]: location counter(`.`)를 4바이트 경계로 정렬하는 것을 의미한다. 다시 말하면, 현재 주소를 4의 배수로 올림하는 것이다.
[^4]: OS/커널에서는 페이지 단위(4KB)로 메모리를 관리하기 때문에 페이지 경계를 4096의 배수로 맞춰주는 것이다.