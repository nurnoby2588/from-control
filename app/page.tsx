"use client";
import React, { useState, useEffect, CSSProperties } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Autocomplete, TextField } from "@mui/material";
import { RingLoader } from "react-spinners";

type Member = {
  _id?: string;
  idNo: string;
  fullName: string;
  phoneNumber: string;
  bloodGroup: string;
  presentAddress: string;
  category: "A" | "B";
  dob: string; // Date in string format (YYYY-MM-DD)
};

const override: CSSProperties = {
  display: "block",
  margin: "0 auto",
  borderColor: "red",
};

const BASE_URL = "https://actor-ashy.vercel.app"; // Base URL for the API

const Home: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<"A" | "B" | "">("");
  const [actorCount, setActorCount] = useState({
    categoryACount: 0,
    categoryBCount: 0,
    totalActor: 0,
  });
  const [currentPage, setCurrentPage] = useState(1); // Current page for pagination
  const [totalPages, setTotalPages] = useState(1); // Total pages for pagination

  const { register, handleSubmit, reset, setValue, watch } = useForm<Member>();

  // Watch for form values (for debugging purposes)
  const formValues = watch();

  // Fetch members from API
  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${BASE_URL}/api/v1/actors?page=${currentPage}&search=${searchQuery}&category=${filterCategory}`
      );
      const data = await response.json();
      if (response.ok) {
        const actors = data?.data?.actor || [];
        const categoryACount = data?.data?.categoryACount || 0;
        const categoryBCount = data?.data?.categoryBCount || 0;
        const totalActor = data?.data?.totalActor || 0;
        const totalPage = data?.data?.totalPage || 1;

        setActorCount({ categoryACount, categoryBCount, totalActor });
        setMembers(actors);
        setTotalPages(totalPage); // Set total pages for pagination
        setIsLoading(false);
      } else {
        console.error("Error fetching members:", data.message || "Unknown error");
        setMembers([]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      setMembers([]);
      setIsLoading(false);
    }
  };

  // Handle form submission
  const onSubmit: SubmitHandler<Member> = async (data) => {
    try {
      const newMember = {
        ...data,
        dob: dateOfBirth ? dateOfBirth.toISOString().split("T")[0] : editingMember?.dob || "", // Use existing dob if editing
      };

      let response;

      if (editingMember) {
        // Update existing member
        response = await fetch(`${BASE_URL}/api/v1/admin/update-actor/${editingMember._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newMember),
        });
      } else {
        // Add new member
        response = await fetch(`${BASE_URL}/api/v1/admin/add-actor`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newMember),
        });
      }

      if (response.ok) {
        fetchMembers(); // Refresh the members list
        if (editingMember) {
          alert("Member updated successfully!");
        } else {
          alert("Member added successfully!");
        }
        setIsModalOpen(false); // Close modal
        reset(); // Reset form fields
        setDateOfBirth(null); // Reset date picker
        setEditingMember(null); // Clear editing state
      } else {
        const errorData = await response.json();
        console.error("Failed to process member:", errorData.message || "Unknown error");
        alert(`Failed to ${editingMember ? "update" : "add"} member. Please try again.`);
      }
    } catch (error) {
      console.error("Error processing member:", error);
      alert(`Failed to ${editingMember ? "update" : "add"} member. Please try again.`);
    }
  };

  // Open Modal for Adding/Editing Member
  const handleOpenModal = (member: Member | null = null) => {
    setIsModalOpen(true);
    setEditingMember(member);

    if (member) {
      // Prefill form for editing
      reset(member);
      setDateOfBirth(new Date(member.dob));
    } else {
      // Reset form for adding
      reset();
      setDateOfBirth(null);
    }
  };

  // Close Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    reset();
    setDateOfBirth(null);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page); // Update the current page
    }
  };
  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
      const handle = setTimeout(() => {
        setDebouncedValue(value)
      }, delay)
      return ()=>{
        clearTimeout(handle)
      }
    }, [value, delay])
    return debouncedValue
  }
  const debounceSearch = useDebounce(searchQuery,500)

  // Fetch members on component mount or when search/filter/pagination changes
  useEffect(() => {
    fetchMembers();
  }, [debounceSearch, filterCategory, currentPage]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Members Management</h1>

      {/* Total Members */}
      <div className="mb-4">
        <p>Total Members: {actorCount?.totalActor}</p>
        <p>Category A: {actorCount?.categoryACount}</p>
        <p>Category B: {actorCount?.categoryBCount}</p>
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
        onClick={() => handleOpenModal()}
      >
        Add Member
      </button>

      {/* Members Table */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2">ID</th>
              <th className="border border-gray-300 p-2">Full Name</th>
              <th className="border border-gray-300 p-2">Phone Number</th>
              <th className="border border-gray-300 p-2">Blood Group</th>
              <th className="border border-gray-300 p-2">Present Address</th>
              <th className="border border-gray-300 p-2">Category</th>
              <th className="border border-gray-300 p-2">Date of Birth</th>
              <th className="border border-gray-300 p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length > 0 ? (
              members.map((member, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 p-2">{member.idNo}</td>
                  <td className="border border-gray-300 p-2">{member.fullName}</td>
                  <td className="border border-gray-300 p-2">{member.phoneNumber}</td>
                  <td className="border border-gray-300 p-2">{member.bloodGroup}</td>
                  <td className="border border-gray-300 p-2">{member.presentAddress}</td>
                  <td className="border border-gray-300 p-2">{member.category}</td>
                  <td className="border border-gray-300 p-2">{member.dob}</td>
                  <td className="border border-gray-300 p-2">
                    <button
                      className="bg-yellow-500 text-white px-2 py-1 rounded"
                      onClick={() => handleOpenModal(member)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="border border-gray-300 p-2 text-center">
                  No members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded ${currentPage === 1
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            onClick={() => handlePageChange(index + 1)}
            className={`px-4 py-2 rounded ${currentPage === index + 1
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            {index + 1}
          </button>
        ))}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded ${currentPage === totalPages
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
        >
          Next
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
              {editingMember ? "Edit Member" : "Add Member"}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* ID No */}
              <div className="mb-6">
                <label className="block font-medium text-gray-700 mb-2">ID No</label>
                <input
                  {...register("idNo", { required: true })}
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter ID No"
                />
              </div>

              {/* Full Name */}
              <div className="mb-6">
                <label className="block font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  {...register("fullName", { required: true })}
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Full Name"
                />
              </div>

              {/* Phone Number */}
              <div className="mb-6">
                <label className="block font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  {...register("phoneNumber", { required: true })}
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Phone Number"
                />
              </div>

              {/* Blood Group */}
              <div className="mb-6">
                <label className="block font-medium text-gray-700 mb-2">Blood Group</label>
                <input
                  {...register("bloodGroup")}
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Blood Group"
                />
              </div>

              {/* Present Address */}
              <div className="mb-6">
                <label className="block font-medium text-gray-700 mb-2">Present Address</label>
                <input
                  {...register("presentAddress")}
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Address"
                />
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block font-medium text-gray-700 mb-2">Category</label>
                <select
                  {...register("category", { required: true })}
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" disabled>
                    Select Category
                  </option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div className="mb-6">
                <label className="block font-medium text-gray-700 mb-2">Date of Birth</label>
                <DatePicker
                  selected={dateOfBirth}
                  onChange={(date) => setDateOfBirth(date)}
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholderText="Select Date"
                  dateFormat="yyyy-MM-dd"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {editingMember ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="fixed inset-0 flex justify-center items-center">
          <RingLoader color={"#000000"} loading={isLoading} cssOverride={override} size={60} />
        </div>
      )}
    </div>
  );
};

export default Home;
