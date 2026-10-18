import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, it, expect, vi } from "vitest";
import AuthPage from "./AuthPage.jsx";
import { useAuth } from "../context/Auth.jsx";
vi.mock("../context/Auth.jsx", () => ({ useAuth: vi.fn() }));
vi.mock("../services/api.js", () => ({
  api: { post: vi.fn() },
  errorText: () => "Login failed",
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
it("routes a parent login to the parent dashboard", async () => {
  const login = vi.fn().mockResolvedValue({ roles: ["Parent"] });
  useAuth.mockReturnValue({ user: null, login });
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/parent" element={<p>Parent dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.change(
    screen.getByLabelText("மின்னஞ்சல் / குழந்தையின் உள்நுழைவு முகவரி"),
    { target: { value: "parent@example.test" } },
  );
  fireEvent.change(screen.getByLabelText("கடவுச்சொல்"), {
    target: { value: "Password-123!" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "உள்நுழைக" }).closest("form"),
  );
  expect(await screen.findByText("Parent dashboard")).toBeInTheDocument();
});
