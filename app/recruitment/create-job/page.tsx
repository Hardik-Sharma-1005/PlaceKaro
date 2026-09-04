"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getRecruitmentData,
  saveRecruitmentData,
} from "../../../lib/recruitmentStore";

export default function CreateJobPage() {
  const router = useRouter();

  const existingData = getRecruitmentData();

  const [jobTitle, setJobTitle] = useState(existingData.job.jobTitle);
  const [companyName, setCompanyName] = useState(
    existingData.job.companyName
  );
  const [location, setLocation] = useState(existingData.job.location);
  const [jobType, setJobType] = useState(existingData.job.jobType);
  const [description, setDescription] = useState(
    existingData.job.description
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const currentData = getRecruitmentData();

    saveRecruitmentData({
      ...currentData,

      job: {
        jobTitle,
        companyName,
        location,
        jobType,
        description,
      },
    });

    router.push("/recruitment/requirements");
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">

        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 text-sm text-gray-600 hover:text-black"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold text-gray-900">
          Create Job
        </h1>

        <p className="mt-2 text-gray-600">
          Enter the basic details for the job posting.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-6 rounded-xl bg-white p-6 shadow-sm"
        >

          <div>
            <label className="block font-medium text-gray-900">
              Job Title
            </label>

            <input
              type="text"
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              placeholder="e.g. Frontend Developer"
              required
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-900">
              Company Name
            </label>

            <input
              type="text"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="e.g. ABC Technologies"
              required
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-900">
              Location
            </label>

            <input
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="e.g. Noida"
              required
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-900">
              Job Type
            </label>

            <select
              value={jobType}
              onChange={(event) => setJobType(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            >
              <option value="Full Time">Full Time</option>
              <option value="Part Time">Part Time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-900">
              Job Description
            </label>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Enter the job description..."
              required
              rows={6}
              className="mt-2 w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800"
            >
              Continue to Requirements →
            </button>
          </div>

        </form>
      </div>
    </main>
  );
}