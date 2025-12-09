"use client";
import React, { useState, useEffect, use,CSSProperties  } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Autocomplete, TextField } from "@mui/material";
import { ClipLoader, RingLoader } from "react-spinners";

type Member = {
  idNo: string;
  fullName: string;
  phoneNumber: string;
  bloodGroup: string;
  presentAddress: string;
  category: "A" | "B";
  dob: string;
};
const override: CSSProperties = {
  display: "block",
  margin: "0 auto",
  borderColor: "red",
};

const BASE_URL = "https://actor-ashy.vercel.app"; // Base URL for the API

const Home: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<"A" | "B" | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1); // Current page for backend pagination
  const [totalPages, setTotalPages] = useState(1); // Total pages from backend
  const [actorCount, setActorCount] = useState({
    categoryACount: 0,
    categoryBCount: 0,
    totalActor: 0,
  });
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const { register, handleSubmit, reset } = useForm<Member>();
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [isLosding, setIsLoading] = useState(false);

  // Fetch members from the API using `fetch`
  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${BASE_URL}/api/v1/actors?page=${currentPage}&search=${searchQuery}&category=${filterCategory}`
      );
      const data = await response.json();
      console.log(data)

      if (response.ok) {
        const actors = data?.data?.actor;
        const categoryACount = data?.data?.categoryACount;
        const categoryBCount = data?.data?.categoryBCount;
        const totalActor = data?.data?.totalActor;
        const totalPage = data?.data?.totalPage;

        setActorCount({
          categoryACount,
          categoryBCount,
          totalActor,
        });
        setMembers(actors); // Assuming 'data' contains the members array
        setTotalPages(totalPage); // Assuming 'totalPages' is returned by the backend
        setIsLoading(false);
      } else {
        console.log("data", data)
         setIsLoading(false);
        console.error("Error fetching members:", data.message || "Unknown error");
        setMembers([]);
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error fetching members:", error);
      setMembers([]);
    }
  };
  const useDebounce = (value: string, delay: number) => {
    const [debounceData, setDebounceData] = useState(value)
    console.log("Deboundce", debounceData);
    useEffect(() => {
      const handle = setTimeout(() => {
       setDebounceData(value)
      }, delay);
      return () => {
        clearTimeout(handle)
      }
    }, [value, delay])
    return debounceData
  }
  console.log(searchQuery)
  console.log(isLosding)
  const debounceSearch = useDebounce(searchQuery, 500)
  console.log(debounceSearch)
  // Fetch paginated members from the API
  useEffect(() => {
    fetchMembers();
  }, [currentPage, debounceSearch, filterCategory]);

  // Submit handler for adding a new member using `fetch`
  const onSubmit: SubmitHandler<Member> = async (data) => {
    try {
      const newMember = {
        idNo: String(data.idNo),
        fullName: String(data.fullName),
        phoneNumber: String(data.phoneNumber),
        bloodGroup: String(data.bloodGroup),
        presentAddress: String(data.presentAddress),
        category: String(data.category),
        dob: dateOfBirth ? dateOfBirth.toISOString().split("T")[0] : "", // Convert date to string (YYYY-MM-DD)
      };

      const response = await fetch(`${BASE_URL}/api/v1/admin/add-actor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMember),
      });

      if (response.ok) {
        fetchMembers(); // Refresh the members list
        alert("Member added successfully!");
        setCurrentPage(1); // Reset to the first page
        setIsModalOpen(false);
        reset();
        setDateOfBirth(null);
      } else {
        const data = await response.json();
        console.log(data)
        console.error("Failed to add member:", data.message || "Unknown error");
        alert("Failed to add member. Please try again.");
      }
    } catch (error) {
      console.error("Error adding member:", error);
      alert("Failed to add member. Please try again.");
    }
  };
  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setIsModalOpen(true);
  }
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // useEffect(() => {
  //   if (editingMember) {
  //     // Set default values for the form inputs when editingMember changes
  //     reset({
  //       idNo: editingMember.idNo,
  //       fullName: editingMember.fullName,
  //       phoneNumber: editingMember.phoneNumber,
  //       bloodGroup: editingMember.bloodGroup,
  //       presentAddress: editingMember.presentAddress,
  //       category: editingMember.category,
  //       dob: editingMember.dob,
  //     });
  //     // setDateOfBirth(new Date(editingMember.dob)); // Set the date picker value
  //   } else {
  //     reset(); // Clear the form when editingMember is null (e.g., when adding a new member)
  //     setDateOfBirth(null);
  //   }
  // }, [editingMember, reset]);

  console.log(editingMember)
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
        onClick={() => { setIsModalOpen(true); setEditingMember(null); }}
      >
        Add Member
      </button>

      {/* Members Table */}
      <div className="overflow-x-auto">
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
              <th className="border border-gray-300 p-2">Edit</th>
            </tr>
          </thead>
          <tbody>
            {members.length > 0 ? members.map((member, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2">{member.idNo}</td>
                <td className="border border-gray-300 p-2">{member.fullName}</td>
                <td className="border border-gray-300 p-2">{member.phoneNumber}</td>
                <td className="border border-gray-300 p-2">{member.bloodGroup}</td>
                <td className="border border-gray-300 p-2">{member.presentAddress}</td>
                <td className="border border-gray-300 p-2">{member.category}</td>
                <td className="border border-gray-300 p-2">{member.dob}</td>
                <td onClick={() => handleEdit(member)} className="border border-gray-300 p-2 cursor-pointer">🪛</td>
              </tr>
            )) : <tr><td colSpan={7} className="border border-gray-300 p-2 text-center">No members found.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Pagination Buttons */}
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
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Add Member</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* ID No */}
              <div className="mb-6">
                <label className="block font-medium text-gray-700 mb-2">ID No</label>
                <input
                  value={editingMember?.idNo ? editingMember.idNo : undefined}
                  {...register("idNo")}
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter ID No"
                  required
                />
              </div>

              {/* Full Name */}
              <div className="mb-6">
                <label className="block font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  {...register("fullName")}
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Full Name"
                  required
                />
              </div>

              {/* Phone Number */}
              <div className="mb-6">
                <label className="block font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  {...register("phoneNumber")}
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Phone Number"
                  required
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
                  {...register("category")}
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
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
                  onClick={() => { setIsModalOpen(false); setEditingMember(null); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
              {editingMember ? "Edit Member" : "Add Member"}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingMember) {
                  // Update existing member
                  console.log("Updated Member:", editingMember);
                } else {
                  // Add new member
                  console.log("New Member:", {
                    idNo: "",
                    fullName: "",
                    phoneNumber: "",
                    bloodGroup: "",
                    presentAddress: "",
                    category: "",
                    dob: dateOfBirth ? dateOfBirth.toISOString().split("T")[0] : "",
                  });
                }
                setIsModalOpen(false);
                setEditingMember(null);
              }}
            >
              {/* ID No */}
              <div className="mb-6">
                <label className="block font-medium text-gray-700 mb-2">ID No</label>
                <input
                  value={editingMember?.idNo || ""}
                  onChange={(e) =>
                    setEditingMember((prev) =>
                      prev ? { ...prev, idNo: e.target.value } : null
                    )
                  }
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter ID No"
                  required
                />
              </div>

              {/* Full Name */}
              <div className="mb-6">
                <label className="block font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  value={editingMember?.fullName || ""}
                  onChange={(e) =>
                    setEditingMember((prev) =>
                      prev ? { ...prev, fullName: e.target.value } : null
                    )
                  }
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Full Name"
                  required
                />
              </div>

              {/* Phone Number */}
              <div className="mb-6">
                <label className="block font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  value={editingMember?.phoneNumber || ""}
                  onChange={(e) =>
                    setEditingMember((prev) =>
                      prev ? { ...prev, phoneNumber: e.target.value } : null
                    )
                  }
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Phone Number"
                  required
                />
              </div>

              {/* Blood Group */}
              <div className="mb-6">
                <label className="block font-medium text-gray-700 mb-2">Blood Group</label>
                <input
                  value={editingMember?.bloodGroup || ""}
                  onChange={(e) =>
                    setEditingMember((prev) =>
                      prev ? { ...prev, bloodGroup: e.target.value } : null
                    )
                  }
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Blood Group"
                />
              </div>

              {/* Present Address */}
              <div className="mb-6">
                <label className="block font-medium text-gray-700 mb-2">Present Address</label>
                <input
                  value={editingMember?.presentAddress || ""}
                  onChange={(e) =>
                    setEditingMember((prev) =>
                      prev ? { ...prev, presentAddress: e.target.value } : null
                    )
                  }
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Address"
                />
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={editingMember?.category || ""}
                  onChange={(e) =>
                    setEditingMember((prev) =>
                      prev ? { ...prev, category: e.target.value as "A" | "B" } : null
                    )
                  }
                  className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
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
                  onChange={(date) => {
                    setDateOfBirth(date);
                    setEditingMember((prev) =>
                      prev ? { ...prev, dob: date?.toISOString().split("T")[0] || "" } : null
                    );
                  }}
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
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingMember(null);
                  }}
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
{
  isLosding && <RingLoader color={"#000000"} loading={isLosding} cssOverride={override} size={60} speedMultiplier={1} />
}
    </div>
  );
};

export default Home;
