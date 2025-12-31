---
{"sticker":"lucide//file","tags":["DB","MongoDB"],"dg-publish":true,"permalink":"/resources/books/mongo-db-the-definite-guide/databases/","dgPassFrontmatter":true}
---

MongoDB는 [[Resources/books/MongoDB The Definite Guide/Collections\|collection]]을 *database*로 묶어서 관리한다. 하나의 MongoDB 인스턴스는 여러 database를 가질 수 있고, 각각은 여러 개의 collection을 포함한다. 

각각의 database는 서로 다른 허용 제한을 가지며, 디스크 상에서도 분리된 파일로 저장된다. 하나의 어플리케이션에는 하나의 database를 사용하는 것이 권장된다.

database도 collection처럼 이름으로 구분된다. UTF-8 문자열을 사용할 수 있지만, 빈 문자열(`""`)을 사용할 수 없다. 추가로 포함되면 안 되는 문자들이 있다 : `/`, `\`, `.`, `"`, `*`, `<`, `>`, `:`, `|`, `?`, `$`, ` `, `\0`. 그리고 database의 이름은 대소문자를 구분하며 최대 64-byte크기까지 가능하다.

Self-managed 환경에서 MongoDB는 데이터를 디스크에 파일 형태로 저장하고(저장 위치는 `storage.dbPath`), 이 때문에 이름에 대한 제약(예: `\0` 같은 문자 금지)이 '내부 저장/표현'과 맞물려 생긴다.

#### 예약된 database 이름
- `admin` : 인증/권한 DB로, 일부 관리 작업은 `admin` 접근 권한이 전제된다.
- `local` : 각 `mongod` 인스턴스에 존재하고, 인스턴스 로컬 정보를 저장한다.[^1]
- `config` : 샤딩(sharding) 환경에서 클러스터 메타데이터/설정 정보를 저장하는 내부 DB

#### Namespace
database 이름과 collection 이름을 합친 것을 *namespace*라고 부른다. namespace는 255-byte[^2] 길이[^3]로 제한되는데, 100-byte 길이 미만을 권장한다.
>[!EXAMPLE] `cms` database의 `blog.posts` collection의 namespace : cms.blog.posts

[^1]: 복제되지 않는다.
[^2]: 샤딩된 collection의 경우에는 235-byte 길이 제한
[^3]: `<database>.<collection>` 형식의 길이 전체를 의미한다.
