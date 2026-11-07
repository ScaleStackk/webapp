const pause = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function uploadJudgment(file, onProgress = () => {}) {
  const formData = new FormData();
  formData.append("judgment", file, file.name);

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/judgments");
    request.responseType = "json";
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      }
    });
    request.addEventListener("load", () => {
      const response = request.response || {};
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve(response);
        return;
      }
      reject(new Error(response.error || `Upload failed with status ${request.status}`));
    });
    request.addEventListener("error", () => {
      reject(new Error("The upload service could not be reached."));
    });
    request.addEventListener("abort", () => reject(new Error("Upload cancelled.")));
    request.send(formData);
  });
}

export async function askJudgments({ question, judgmentIds, judgments }) {
  // BACKEND HOOK: Replace this with the retrieval/chat endpoint.
  await pause(950);

  const selected = judgments.filter((item) => judgmentIds.includes(item.id));
  const demoSelected = selected.some((item) => item.id === "demo-judgment");
  const holdingQuestion = /hold|decision|decide|outcome|capital|income/i.test(
    question,
  );

  if (demoSelected && holdingQuestion) {
    return {
      id: `message-${Date.now()}`,
      role: "assistant",
      content:
        "The Supreme Court held that the sale proceeds were capital receipts, not agricultural income. Because the teak trees were removed together with their roots, there was no possibility of regeneration or recurring income. Their removal therefore affected the capital structure itself.",
      sources: [
        {
          judgment: "A.K.T.K.M. Vishnudatta Andharjanam v. Commissioner",
          location: "Pages 3–4",
        },
      ],
      isMock: true,
    };
  }

  return {
    id: `message-${Date.now()}`,
    role: "assistant",
    content: `This is a placeholder response. The future backend will search ${selected.length} selected ${selected.length === 1 ? "judgment" : "judgments"}, synthesize the answer, and return page-level citations for your question: “${question}”`,
    sources: [],
    isMock: true,
  };
}
