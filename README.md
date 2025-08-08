# 장치 등록 시스템 (Device Registration System)

무인 가챠 자판기 장치들이 중앙 서버에 자동으로 등록될 수 있도록 하는 NestJS 기반 백엔드 시스템입니다.

## 🏗️ 아키텍처

```
src/
├── controller/         # API 라우팅 계층
├── service/           # 비즈니스 로직 계층
├── domain/            # 도메인 모델 및 DTO
├── interface/         # 외부 시스템 인터페이스
│   ├── db/           # DynamoDB 인터페이스
│   ├── messaging/    # SQS 메시징 인터페이스
│   └── auth/         # JWT 인증 모듈
└── main.ts           # 애플리케이션 진입점
```

## 🚀 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.example`을 `.env`로 복사하고 필요한 값들을 설정하세요.

```bash
cp .env.example .env
```

### 3. AWS 설정
DynamoDB 테이블과 SQS 권한이 필요합니다.

#### DynamoDB 테이블 생성
```bash
# devices 테이블
aws dynamodb create-table \
  --table-name devices \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
    IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

# device-logs 테이블
aws dynamodb create-table \
  --table-name device-logs \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

### 4. 애플리케이션 실행
```bash
# 개발 모드
npm run start:dev

# 프로덕션 빌드
npm run build
npm run start:prod
```

## 📚 API 문서

애플리케이션 실행 후 다음 URL에서 Swagger 문서를 확인할 수 있습니다:
- http://localhost:3000/api/docs

## 🔌 API 엔드포인트

### 장치 등록 (공개)
```http
POST /api/devices/register
Content-Type: application/json

{
  "hardwareId": "HW001",
  "tenantId": "TENANT001",
  "ipAddress": "192.168.1.100",
  "systemInfo": {
    "os": "linux",
    "arch": "arm64",
    "mac": "xx:xx:xx:xx:xx:xx"
  }
}
```

### 승인 상태 확인 (공개)
```http
GET /api/devices/status/HW001?tenantId=TENANT001
```

### 장치 승인 (관리자 인증 필요)
```http
PUT /api/devices/{deviceId}/approve
Authorization: Bearer {JWT_TOKEN}
```

### 장치 거부 (관리자 인증 필요)
```http
PUT /api/devices/{deviceId}/reject
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "reason": "이미 등록된 장치입니다"
}
```

### 대기 중인 장치 목록 (관리자 인증 필요)
```http
GET /api/devices/pending
Authorization: Bearer {JWT_TOKEN}
```

## 🔐 인증

관리자 API는 JWT 토큰이 필요합니다. 토큰은 다음 형식으로 전송해야 합니다:

```http
Authorization: Bearer {JWT_TOKEN}
```

JWT 페이로드 예시:
```json
{
  "sub": "admin-user-id",
  "username": "admin",
  "role": "admin",
  "iat": 1640995200,
  "exp": 1641081600
}
```

## 🔄 장치 등록 플로우

1. **장치 등록**: 장치가 부팅 시 `/api/devices/register`로 등록 요청
2. **상태 폴링**: 5분 간격으로 `/api/devices/status/{hardwareId}` 호출
3. **관리자 승인**: 웹 대시보드에서 승인/거부 처리
4. **큐 URL 발급**: 승인 시 SQS 큐 URL 제공
5. **재시도 로직**: 24시간 후 승인되지 않으면 재등록

## 🗄️ 데이터베이스 스키마

### devices 테이블
- **PK**: `TENANT#{tenantId}`
- **SK**: `DEVICE#{hardwareId}`
- **GSI1PK**: `STATUS#{status}` (상태별 조회용)
- **GSI1SK**: `{registeredAt}` (등록 시간순 정렬)

### device-logs 테이블
- **PK**: `TENANT#{tenantId}`
- **SK**: `LOG#{timestamp}#{logId}`

## 🧪 테스트

```bash
# 단위 테스트
npm run test

# 테스트 커버리지
npm run test:cov

# E2E 테스트
npm run test:e2e
```

## 🔧 확장성 고려사항

1. **메시징 추상화**: `IMessagingService` 인터페이스를 통해 SQS에서 Kafka로 쉽게 전환 가능
2. **데이터베이스 추상화**: `IDatabaseService` 인터페이스를 통해 다른 DB로 전환 가능
3. **계층 분리**: 각 계층이 독립적으로 테스트 가능하도록 설계
4. **의존성 주입**: NestJS DI 컨테이너를 활용한 느슨한 결합

## 🚨 보안 고려사항

- JWT 토큰 기반 인증
- 입력값 유효성 검증 (class-validator)
- IP 주소 로깅
- CORS 설정
- 환경 변수를 통한 민감 정보 관리

## 📈 모니터링 및 로깅

모든 장치 활동은 `device-logs` 테이블에 기록됩니다:
- 등록 요청
- 상태 확인
- 승인/거부 처리

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request