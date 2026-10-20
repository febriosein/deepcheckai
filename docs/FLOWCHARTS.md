# 📊 Dokumentasi Diagram Alir (Flowcharts) — DeepCheck AI

Dokumentasi ini memetakan seluruh alur kerja sistem, logika pengambilan keputusan kecerdasan buatan, proses pengurai tautan media sosial, serta komunikasi *real-time* berbasis *Server-Sent Events* (SSE) pada platform **DeepCheck AI**.

---

## 📑 Daftar Diagram

1. [Diagram 1: Flowchart Sistem Menyeluruh (End-to-End System)](#1-flowchart-sistem-menyeluruh-end-to-end-system)
2. [Diagram 2: Flowchart Pengurai Tautan & Media Sosial (URL Resolver Pipeline)](#2-flowchart-pengurai-tautan--media-sosial-url-resolver-pipeline)
3. [Diagram 3: Flowchart Matriks Keputusan & Pipeline 9-Router AI](#3-flowchart-matriks-keputusan--pipeline-9-router-ai)
4. [Diagram 4: Sequence Diagram Streaming Real-Time SSE](#4-sequence-diagram-streaming-real-time-sse)
5. [Diagram 5: State Transition Diagram (State Machine Status Verifikasi)](#5-state-transition-diagram-status-verifikasi)

---

## 1. Flowchart Sistem Menyeluruh (End-to-End System)

Diagram ini mengilustrasikan perjalanan data mulai dari interaksi pengguna di antarmuka web, validasi peramban, pengiriman ke *API Route Handler*, pemrosesan di orkestrator multi-jalur, hingga rendering hasil analitik ke layar pengguna.

```mermaid
flowchart TD
    Start(["Mulai: Pengguna Membuka DeepCheck AI"]) --> SelectInput{"Pilih Tab Input"}

    SelectInput -->|"Tab 1: Tautan"| InputURL["Masukkan URL (Instagram / TikTok / YouTube / Berita)"]
    SelectInput -->|"Tab 2: Berkas"| InputFile["Pilih Berkas Media (JPG, PNG, WEBP, MP4, MP3, WAV)"]
    SelectInput -->|"Tab 3: Teks"| InputText["Masukkan Teks Klaim / Pesan Berantai (Min. 10 Karakter)"]

    InputFile --> ValidateFile{"Validasi Klien & Ukuran"}
    ValidateFile -->|"Foto > 3.5 MB"| AutoCompress["Kompresi Otomatis via HTML5 Canvas (Max 1920px, JPEG 0.85)"]
    ValidateFile -->|"Video/Audio > 4.5 MB"| FileError["Tampilkan Panduan: Gunakan Tab Tautan untuk Video Besar"]
    ValidateFile -->|"Ukuran <= 4.5 MB"| SubmitPayload["Siapkan FormData"]
    AutoCompress --> SubmitPayload

    InputURL --> ValidateURL{"Validasi Sintaks URL"}
    ValidateURL -->|"URL Tidak Valid"| URLError["Tampilkan Pesan Error Validasi"]
    ValidateURL -->|"URL Valid"| SubmitPayload

    InputText --> ValidateText{"Validasi Panjang Teks"}
    ValidateText -->|"Teks < 10 Karakter"| TextError["Tampilkan Pesan Error: Minimal 10 Karakter"]
    ValidateText -->|"Teks Cukup"| SubmitPayload

    SubmitPayload --> SendAPI["Kirim POST ke /api/analyze?stream=true"]
    SendAPI --> APIGateway["Vercel Serverless Function (Node.js, maxDuration: 60s)"]

    APIGateway --> SSEStream["Buka Aliran SSE (text/event-stream)"]
    SSEStream --> RunOrchestrator["Jalankan orchestrateAnalysis()"]

    RunOrchestrator --> ProgressEvent["Kirim Event Kemajuan Real-time: data: {type: 'progress', ...}"]
    ProgressEvent --> ClientUIProgress["Update Stepper & Bar Progress pada Klien"]

    RunOrchestrator --> FinalEngine["Sintesis Skor Akhir (Router 9)"]
    FinalEngine --> ResultEvent["Kirim Event Hasil: data: {type: 'result', result: FinalScoreResult}"]
    
    ResultEvent --> RenderDashboard["Render Dashboard Hasil Verifikasi"]
    RenderDashboard --> Gauge["Radial Gauge Skor Keaslian (0-100%) & Kategori Risiko"]
    RenderDashboard --> Pillars["4 Pilar Integritas (Visual, Klaim, Sumber, Retorika)"]
    RenderDashboard --> Indicators["Daftar Temuan Forensik Multi-Dimensi"]
    RenderDashboard --> Sources["Daftar Rujukan Resmi (TurnBackHoax / Kominfo)"]
    RenderDashboard --> DebunkAction["Fitur Ekspor / Salin Pesan Klarifikasi WhatsApp"]

    DebunkAction --> End(["Selesai / Periksa Media Lainnya"])
    FileError --> SelectInput
    URLError --> SelectInput
    TextError --> SelectInput
```

---

## 2. Flowchart Pengurai Tautan & Media Sosial (URL Resolver Pipeline)

Diagram ini merinci algoritma modul [`url-resolver.ts`](file:///c:/Users/Renno/Desktop/deepcheck/src/lib/url-resolver.ts) dalam mengidentifikasi platform tautan dan mengekstrak materi digital yang dibutuhkan oleh AI tanpa memerlukan token API pihak ketiga yang berbayar.

```mermaid
flowchart TD
    InURL["Input URL Masuk"] --> CleanURL["Sanitasi URL & Ekstraksi Hostname"]

    CleanURL --> PlatformMatch{"Identifikasi Pola Domain"}

    PlatformMatch -->|"tiktok.com / vm.tiktok.com"| ProcessTikTok["Pipeline TikTok"]
    PlatformMatch -->|"instagram.com / reel / p"| ProcessIG["Pipeline Instagram"]
    PlatformMatch -->|"youtube.com / youtu.be"| ProcessYT["Pipeline YouTube"]
    PlatformMatch -->|"x.com / twitter.com"| ProcessTwitter["Pipeline X / Twitter"]
    PlatformMatch -->|"Domain Web Umum / Berita"| ProcessWeb["Pipeline Berita & Web"]

    %% TikTok Branch
    ProcessTikTok --> TTAPI["Request ke TikTok oEmbed API: https://www.tiktok.com/oembed"]
    TTAPI --> TTExtract["Ekstraksi: Judul, Caption Pembuat, Author, Thumbnail URL"]
    TTExtract --> FetchTTThumb["Download Thumbnail & Konversi ke Base64 (Sharp / Buffer)"]

    %% Instagram Branch
    ProcessIG --> FetchIGHTML["Fetch HTML Halaman Publik dengan Browser User-Agent"]
    FetchIGHTML --> IGMeta["Scraping Meta Tags: og:title, og:description, og:image"]
    IGMeta --> FetchIGThumb["Download Thumbnail Instagram & Konversi ke Base64"]

    %% YouTube Branch
    ProcessYT --> YTAPI["Request ke YouTube oEmbed API & Parse Video ID"]
    YTAPI --> YTHQ["Ambil Thumbnail Kualitas Tinggi: hqdefault.jpg / maxresdefault.jpg"]
    YTHQ --> FetchYTThumb["Download Thumbnail YouTube & Konversi ke Base64"]

    %% Twitter Branch
    ProcessTwitter --> TwAPI["Request ke Twitter Publish oEmbed API"]
    TwAPI --> TwText["Ekstraksi Teks Tweet Lengkap & Identitas Akun"]

    %% Web Branch
    ProcessWeb --> FetchWebHTML["Fetch Dokumen HTML Portal Berita"]
    FetchWebHTML --> ParseDOM["Ekstraksi Tag: og:title, meta[description], article[body], p tags"]
    ParseDOM --> CleanArticle["Pembersihan Elemen Sampah (Iklan, Navigasi, Komentar)"]

    %% Aggregation
    FetchTTThumb --> BuildResolved["Susun Objek ResolvedUrlContent"]
    FetchIGThumb --> BuildResolved
    FetchYTThumb --> BuildResolved
    TwText --> BuildResolved
    CleanArticle --> BuildResolved

    BuildResolved --> EnrichInput["Pengayaan Input: Forward Konten Teks & Gambar ke R1 Intake"]
    EnrichInput --> OutputResolver(["Masuk ke Pipeline Analisis Forensik AI"])
```

---

## 3. Flowchart Matriks Keputusan & Pipeline 9-Router AI

Diagram ini memetakan arsitektur orkestrasi 9 router forensik kecerdasan buatan ([`orchestrator.ts`](file:///c:/Users/Renno/Desktop/deepcheck/src/routers/orchestrator.ts)). Sistem menentukan jalur evaluasi dinamis (*dynamic routing plan*) berdasarkan modalitas konten dan mengeksekusi analisis secara paralel dengan pelindung *timeout*.

```mermaid
flowchart TD
    StartPipe["Input Media Masuk ke Orchestrator"] --> R1["Router 1: Intake & Klasifikasi Format"]

    R1 --> CheckType{"Evaluasi Tipe Media & Ekstraksi"}
    
    %% Branching media
    CheckType -->|"Tipe: Video / Audio"| PlanVA["Routing Plan: R2, R3, R4, R5, R6, R7, R8"]
    CheckType -->|"Tipe: Gambar"| PlanImg["Routing Plan: R3, R4, R7, R8"]
    CheckType -->|"Tipe: Teks / Narasi Berita"| PlanTxt["Routing Plan: R7, R8"]

    %% R2 Preprocessing
    PlanVA --> R2["Router 2: Pra-pemrosesan Sinyal Media"]
    R2 --> R2Process["Sampling Frame Kunci (I-Frames) & Ekstraksi Sinyal Audio"]
    R2Process --> ParallelBatch

    PlanImg --> ParallelBatch
    PlanTxt --> TextBatch["Eksekusi R7 Langsung"]

    %% Parallel Batch Execution
    subgraph ParallelBatch ["Eksekusi Paralel (Promise.allSettled dengan Timeout Guard)"]
        direction TB
        R3["Router 3: OCR & Ekstraksi Klaim (Gemini Vision)"]
        R4["Router 4: Forensik Artefak Gambar (Distorsi AI / Difusi)"]
        R5["Router 5: Analisis Video & Gerak Temporal (Deepfake / Lip-sync)"]
        R6["Router 6: Forensik Audio Sintetis (Kloning Suara / Nada Datar)"]
        R7["Router 7: Analisis Pola Bahasa & NLP (Urgency Trap / Provokasi)"]
    end

    ParallelBatch --> AggregateBatch["Kumpulkan Hasil Temuan Paralel (R3 s/d R7)"]
    TextBatch --> AggregateBatch

    %% Sequential Stages
    AggregateBatch --> R8["Router 8: Penelusuran Silang Sumber Resmi"]
    R8 --> R8Query["Cocokkan Klaim Fakta ke Basis Data: TurnBackHoax Mafindo, Kominfo, CekFakta"]
    R8Query --> R8Result["Hasil Verifikasi Sumber: Terbantahkan / Terkonfirmasi / Meragukan"]

    R8Result --> R9["Router 9: Sintesis Skor & Modul Literasi"]
    
    subgraph R9Engine ["Logika Perhitungan Skor Terpadu (Router 9)"]
        direction TB
        WeightPillars["Pembobotan Tertimbang 4 Pilar (Visual, Logika, Sumber, Bahasa)"]
        MitigateFP["Mitigasi False Positive (Deteksi Satir, Parodi vs Niat Jahat)"]
        CalcFinal["Kalkulasi Skor Probabilitas Akhir (0 - 100%)"]
        AssignRisk["Penetapan Kategori: Kritis (0-34), Tinggi (35-59), Sedang (60-79), Rendah (80-100)"]
        GenLiteracy["Penyusunan Modul Edukasi 60 Detik 'Saring Sebelum Sharing'"]
        WeightPillars --> MitigateFP --> CalcFinal --> AssignRisk --> GenLiteracy
    end

    R9 --> R9Engine
    R9Engine --> OutputResult(["Hasil Terstruktur FinalScoreResult Dikembalikan"])
```

---

## 4. Sequence Diagram Streaming Real-Time SSE

Diagram urutan ini menggambarkan pertukaran pesan secara asinkron antara *Browser Klien*, *Next.js Serverless Route*, *Orchestrator*, dan *Google Gemini AI API* menggunakan teknologi *Server-Sent Events* (SSE).

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna (Browser)
    participant Client as Frontend (Next.js Page)
    participant API as Route Handler (/api/analyze)
    participant Orch as Orchestrator Pipeline
    participant AI as Google Gemini 2.5 API

    User->>Client: Klik "Verifikasi Keaslian"
    Client->>Client: Tampilkan Loading State & Stepper
    Client->>API: POST /api/analyze?stream=true (FormData)
    activate API
    API-->>Client: 200 OK (headers: Content-Type: text/event-stream)
    
    API->>Orch: orchestrateAnalysis(input, onProgress)
    activate Orch

    %% R1
    Orch->>AI: generateContent(R1 Intake Prompt)
    activate AI
    AI-->>Orch: Tipe Media & Routing Plan
    deactivate AI
    Orch-->>API: onProgress({step: "R1", status: "completed"})
    API-->>Client: data: {"type":"progress","progress":{"step":"R1","label":"Format media terklasifikasi"}}
    Client->>Client: Perbarui Stepper Tahap 1 Aktif

    %% R3 - R7 Paralel
    par Analisis Forensik Paralel
        Orch->>AI: Analisis Visual R4 (Artefak AI)
        Orch->>AI: Analisis Bahasa R7 (Pola NLP)
        Orch->>AI: Analisis OCR R3 (Ekstraksi Klaim)
    end
    activate AI
    AI-->>Orch: Hasil Bukti & Anomali Forensik
    deactivate AI
    Orch-->>API: onProgress({step: "R3", status: "completed"})
    API-->>Client: data: {"type":"progress","progress":{"step":"R3","label":"Analisis artefak selesai"}}
    Client->>Client: Perbarui Stepper Tahap 2 Aktif

    %% R8
    Orch->>AI: generateContent(R8 Source Check Prompt + Klaim R3)
    activate AI
    AI-->>Orch: Rujukan Resmi (TurnBackHoax / Kominfo)
    deactivate AI
    Orch-->>API: onProgress({step: "R8", status: "completed"})
    API-->>Client: data: {"type":"progress","progress":{"step":"R8","label":"Pemeriksaan fakta selesai"}}
    Client->>Client: Perbarui Stepper Tahap 3 Aktif

    %% R9
    Orch->>AI: generateContent(R9 Score Synthesis Prompt)
    activate AI
    AI-->>Orch: FinalScoreResult (Skor, Indikator, Rekomendasi)
    deactivate AI
    Orch-->>API: onProgress({step: "done", status: "completed"})
    Orch-->>API: Return finalResult
    deactivate Orch

    API-->>Client: data: {"type":"result","result":{finalResult}}
    API-->>Client: Tutup Koneksi SSE (controller.close())
    deactivate API

    Client->>Client: Matikan Loading, Tampilkan Gauge & ScoreCard
    Client-->>User: Tampilkan Hasil Analisis & Opsi Bagikan
```

---

## 5. State Transition Diagram (Status Verifikasi)

Diagram mesin keadaan (*state machine*) berikut memetakan transisi status antarmuka pengguna pada komponen [`page.tsx`](file:///c:/Users/Renno/Desktop/deepcheck/src/app/page.tsx) sepanjang siklus hidup analisis media:

```mermaid
stateDiagram-v2
    [*] --> IDLE : Aplikasi Dimuat

    state IDLE {
        [*] --> MenungguInput
        MenungguInput --> InputTerisi : Pengguna Memasukkan URL/File/Teks
        InputTerisi --> MenungguInput : Reset Form
    }

    IDLE --> VALIDATING : Klik "Verifikasi Keaslian"

    state VALIDATING {
        [*] --> CekUkuran
        CekUkuran --> KompresiCanvas : Gambar > 3.5 MB
        KompresiCanvas --> SiapKirim
        CekUkuran --> TolakUkuran : Video/Audio > 4.5 MB
        CekUkuran --> SiapKirim : Ukuran Sesuai Batas
    }

    VALIDATING --> ERROR_DISPLAY : Validasi Gagal (TolakUkuran / Format Salah)
    VALIDATING --> CONNECTING_API : Validasi Lolos (SiapKirim)

    CONNECTING_API --> STREAMING_PROGRESS : Response 200 (SSE Stream Terbuka)
    CONNECTING_API --> ERROR_DISPLAY : Koneksi Gagal / Kuota Habis (500/504)

    state STREAMING_PROGRESS {
        [*] --> Phase1_Intake : Event Step R1
        Phase1_Intake --> Phase2_Preprocessing : Event Step R2
        Phase2_Preprocessing --> Phase3_ParallelAnalysis : Event Step R3/R4/R5/R6/R7
        Phase3_ParallelAnalysis --> Phase4_SourceVerification : Event Step R8
        Phase4_SourceVerification --> Phase5_ScoreSynthesis : Event Step R9
    }

    STREAMING_PROGRESS --> ANALYSIS_COMPLETE : Event {type: "result"} Diterima
    STREAMING_PROGRESS --> ERROR_DISPLAY : Event {type: "error"} Diterima

    state ANALYSIS_COMPLETE {
        [*] --> TampilkanHasil
        TampilkanHasil --> ModalBagikanTerbuka : Klik "Ekspor Kartu Debunk"
        ModalBagikanTerbuka --> TampilkanHasil : Tutup Modal
        TampilkanHasil --> SalinTeksWA : Klik "Salin Pesan WhatsApp"
    }

    ANALYSIS_COMPLETE --> IDLE : Klik "Periksa Media Lainnya"
    ERROR_DISPLAY --> IDLE : Klik "Coba Kembali"
```

---

<div align="center">
  <b>DeepCheck AI • Dokumentasi Resmi Arsitektur Sistem</b><br />
  PTIK Kelompok 4 • Program Studi Informatika • 2026
</div>
