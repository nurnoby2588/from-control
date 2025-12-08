import React, { useState, useEffect } from "react";
import axios from "axios";
import { useForm, SubmitHandler } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Autocomplete, TextField } from "@mui/material";

type Member = {
  idNo: string;
  fullName: string;
  phoneNumber: string;
  bloodGroup: string;
  presentAddress: string;
  category: "A" | "B";
  dateOfBirth: string;
};

const BASE_URL = "http://localhost:8000"; // Base URL for the API

const Home: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<"A" | "B" | "">("");
  const [searchQuery, setSearchQuery] = useState("");

  const { register, handleSubmit, reset, setValue } = useForm<Member>();
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);

  // Fetch members from the API
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/v1/actors`);
        setMembers(response.data);
        setFilteredMembers(response.data);
      } catch (error) {
        console.error("Error fetching members:", error);
      }
    };

    fetchMembers();
  }, []);

  // Filter members based on category and search query
  useEffect(() => {
    let filtered = members;

    if (filterCategory) {
      filtered = filtered.filter((member) => member.category === filterCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter((member) =>
        member.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredMembers(filtered);
  }, [filterCategory, searchQuery, members]);

  // Submit handler for adding a new member
  const onSubmit: SubmitHandler<Member> = async (data) => {
    try {
      // Convert all form data to strings
      const newMember = {
        idNo: String(data.idNo),
        fullName: String(data.fullName),
        phoneNumber: String(data.phoneNumber),
        bloodGroup: String(data.bloodGroup),
        presentAddress: String(data.presentAddress),
        category: String(data.category),
        dateOfBirth: dateOfBirth ? dateOfBirth.toISOString().split("T")[0] : "", // Convert date to string (YYYY-MM-DD)
      };

      // Send POST request to backend
      const response = await axios.post(`${BASE_URL}/api/admin/add-actor`, newMember);

      // Update members list with the new member
      setMembers((prev) => [...prev, response.data]);

      // Close the modal and reset the form
      setIsModalOpen(false);
      reset();
      setDateOfBirth(null);
    } catch (error) {
      console.error("Error adding member:", error);
      alert("Failed to add member. Please try again.");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Members Management</h1>

      {/* Total Members */}
      <div className="mb-4">
        <p>Total Members: {members.length}</p>
        <p>Category A: {members.filter((member) => member.category === "A").length}</p>
        <p>Category B: {members.filter((member) => member.category === "B").length}</p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name"
          className="border p-2 rounded w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Autocomplete
          options={["A", "B"]}
          getOptionLabel={(option) => option}
          renderInput={(params) => <TextField {...params} label="Filter by Category" />}
          onChange={(e, value) => setFilterCategory(value as "A" | "B" | "")}
        />
      </div>

      {/* Add Member Button */}
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={() => setIsModalOpen(true)}
      >
        Add Member
      </button>

      {/* Members Table */}
      <table className="w-full border-collapse border border-gray-300 mt-4">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2">ID</th>
            <th className="border border-gray-300 p-2">Full Name</th>
            <th className="border border-gray-300 p-2">Phone Number</th>
            <th className="border border-gray-300 p-2">Blood Group</th>
            <th className="border border-gray-300 p-2">Present Address</th>
            <th className="border border-gray-300 p-2">Category</th>
            <th className="border border-gray-300 p-2">Date of Birth</th>
          </tr>
        </thead>
        <tbody>
          {filteredMembers.map((member, index) => (
            <tr key={index}>
              <td className="border border-gray-300 p-2">{member.idNo}</td>
              <td className="border border-gray-300 p-2">{member.fullName}</td>
              <td className="border border-gray-300 p-2">{member.phoneNumber}</td>
              <td className="border border-gray-300 p-2">{member.bloodGroup}</td>
              <td className="border border-gray-300 p-2">{member.presentAddress}</td>
              <td className="border border-gray-300 p-2">{member.category}</td>
              <td className="border border-gray-300 p-2">{member.dateOfBirth}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Add Member</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4">
                <label>ID No</label>
                <input
                  {...register("idNo")}
                  className="border p-2 rounded w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label>Full Name</label>
                <input
                  {...register("fullName")}
                  className="border p-2 rounded w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label>Phone Number</label>
                <input
                  {...register("phoneNumber")}
                  className="border p-2 rounded w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label>Blood Group</label>
                <input
                  {...register("bloodGroup")}
                  className="border p-2 rounded w-full"
                />
              </div>
              <div className="mb-4">
                <label>Present Address</label>
                <input
                  {...register("presentAddress")}
                  className="border p-2 rounded w-full"
                />
              </div>
              <div className="mb-4">
                <label>Category</label>
                <select
                  {...register("category")}
                  className="border p-2 rounded w-full"
                  required
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                </select>
              </div>
              <div className="mb-4">
                <label>Date of Birth</label>
                <DatePicker
                  selected={dateOfBirth}
                  onChange={(date) => setDateOfBirth(date)}
                  className="border p-2 rounded w-full"
                  dateFormat="yyyy-MM-dd"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
