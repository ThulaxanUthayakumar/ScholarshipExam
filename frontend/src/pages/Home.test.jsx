import React from "react";
import { MemoryRouter } from "react-router-dom";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import Home from "./Home.jsx";
import { getPilotPackage } from "../services/api.js";
vi.mock("../services/api.js", () => ({ getPilotPackage: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
const data = {
  title: "ஐந்து பயிற்சித் தேர்வுகள்",
  currency: "LKR",
  price: 500,
  examCount: 5,
  questionsPerExam: 40,
  durationMinutes: 60,
};
describe("public package", () => {
  it("renders loading while waiting for API", () => {
    getPilotPackage.mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
  it("renders API price and exam details", async () => {
    getPilotPackage.mockResolvedValue(data);
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/500/)).toBeInTheDocument();
    expect(screen.getByText(/40 வினாக்கள்/)).toBeInTheDocument();
  });
  it("can retry after failure", async () => {
    getPilotPackage
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(data);
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(await screen.findByText(/500/)).toBeInTheDocument();
  });
});
