import React from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, it, expect, vi } from "vitest";
import Exam from "./Exam.jsx";
import { api } from "../services/api.js";
vi.mock("../services/api.js", () => ({
  api: { get: vi.fn(), put: vi.fn(), post: vi.fn() },
  errorText: () => "Network unavailable",
}));
const data = {
  id: "attempt-1",
  status: "Active",
  title: "Test exam",
  serverNow: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 600000).toISOString(),
  questions: [
    {
      id: "q1",
      questionText: "2 + 2 = ?",
      marks: 4,
      options: [
        { id: "o1", key: "A", text: "4" },
        { id: "o2", key: "B", text: "5" },
      ],
    },
  ],
  answers: [],
};
function show() {
  return render(
    <MemoryRouter initialEntries={["/exam/attempt-1"]}>
      <Routes>
        <Route path="/exam/:id" element={<Exam />} />
        <Route path="/result/:id" element={<p>Final result screen</p>} />
      </Routes>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  api.get.mockResolvedValue({ data });
  vi.spyOn(window, "confirm").mockReturnValue(true);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.resetAllMocks();
});
it("restores saved selection on refresh", async () => {
  api.get.mockResolvedValue({
    data: { ...data, answers: [{ questionId: "q1", optionId: "o1" }] },
  });
  show();
  const choices = await screen.findAllByRole("radio");
  expect(choices[0]).toBeChecked();
  expect(api.get).toHaveBeenCalledWith("/attempts/attempt-1/questions");
});
it("persists answer before displaying saved state", async () => {
  api.put.mockResolvedValue({ data: { status: "Active", saved: true } });
  show();
  const choices = await screen.findAllByRole("radio");
  fireEvent.click(choices[0]);
  await waitFor(() => expect(choices[0]).toBeChecked());
  expect(api.put).toHaveBeenCalledWith("/attempts/attempt-1/answers", {
    questionId: "q1",
    optionId: "o1",
  });
});
it("does not pretend an offline answer is saved", async () => {
  api.put.mockRejectedValue(new Error("offline"));
  show();
  const choices = await screen.findAllByRole("radio");
  fireEvent.click(choices[0]);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "சேமிக்கப்படவில்லை",
  );
  expect(choices[0]).not.toBeChecked();
});
it("routes finalized attempts directly to results", async () => {
  api.get.mockResolvedValue({ data: { ...data, status: "Expired" } });
  show();
  expect(await screen.findByText("Final result screen")).toBeInTheDocument();
});
it("submits only after confirmation", async () => {
  api.post.mockResolvedValue({ data: { status: "Submitted" } });
  show();
  const button = await screen.findByRole("button", {
    name: "தேர்வைச் சமர்ப்பி",
  });
  window.confirm.mockReturnValueOnce(false);
  fireEvent.click(button);
  expect(api.post).not.toHaveBeenCalled();
  fireEvent.click(button);
  expect(await screen.findByText("Final result screen")).toBeInTheDocument();
  expect(api.post).toHaveBeenCalledWith("/attempts/attempt-1/submit");
});
