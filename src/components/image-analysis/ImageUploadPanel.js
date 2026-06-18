import { formatFileSize } from "./analysisHelpers";

function ImageUploadPanel({
  fileInputRef,
  fileName,
  imageUrl,
  loading,
  selectedFile,
  onDragOver,
  onDrop,
  onFileChange,
  onOpenFilePicker,
  onUpload,
}) {
  return (
    <section className="image-card image-upload-panel" aria-labelledby="image-upload-title">
      <div className="image-card-header">
        <span className="image-kicker">Input</span>
        <h2 id="image-upload-title">이미지 업로드</h2>
        <p>파일을 끌어오거나 클릭해서 분석할 이미지를 선택하세요.</p>
      </div>

      <div
        className={`image-drop-card ${imageUrl ? "has-preview" : ""}`}
        role="button"
        tabIndex={0}
        onClick={onOpenFilePicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") onOpenFilePicker();
        }}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="Uploaded preview" className="image-preview-media" />
        ) : (
          <div className="upload-empty-state">
            <span className="upload-icon">+</span>
            <strong>Drag & drop image</strong>
            <small>PNG, JPG, WEBP 지원. Ctrl+V 붙여넣기도 가능.</small>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        id="fileInput"
        accept="image/*"
        className="file-input"
        onChange={onFileChange}
      />

      <div className="file-meta-grid">
        <div>
          <span>파일명</span>
          <strong>{fileName || "선택된 파일 없음"}</strong>
        </div>
        <div>
          <span>크기</span>
          <strong>{formatFileSize(selectedFile?.size)}</strong>
        </div>
        <div>
          <span>형식</span>
          <strong>{selectedFile?.type || "-"}</strong>
        </div>
      </div>

      <button className="image-primary-btn" onClick={onUpload} disabled={loading || !selectedFile}>
        {loading ? "분석 중..." : "업로드 후 분석"}
      </button>
    </section>
  );
}

export default ImageUploadPanel;
