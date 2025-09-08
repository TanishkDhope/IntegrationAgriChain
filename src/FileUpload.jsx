import React, { useState } from "react";

function FileUpload() {
  const [formData, setFormData] = useState({
    name: "",
    farmId: "",
    location: "",
    image: null,
  });

  // ⚠️ Never hardcode JWT in production frontend!
  const JWT =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJiNmI3M2VlOS1lNzRlLTQ0YTEtODgxNi05Nzc4NWRhNjljZjYiLCJlbWFpbCI6InRhbmlzaGtkaG9wZUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiNmU2ZjQxNWMzYjk0MmUyOTI4MzUiLCJzY29wZWRLZXlTZWNyZXQiOiI3YTQ5NjUxNjI1ZGE0YjU2MzYyYjRiNjIyOGEzM2M1MGI3MDRiM2MzZGE0MGZmMDI1M2MzY2YyMWFjNmE3YjgxIiwiZXhwIjoxNzg4NTg2Mjg3fQ.oYZeQNa7NcFKTysjoZ7O2iFbp0eeRNKUWBARJu3QW0U"; // your JWT

  // Handle text input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle file input
  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      image: e.target.files[0],
    });
  };

  // Upload to Pinata
  const uploadToIPFS = async () => {
    try {
      if (!formData.name || !formData.farmId || !formData.location) {
        alert("Please fill in all fields.");
        return;
      }

      let imageCid = null;

      // Step 1: Upload image first (if provided)
      if (formData.image) {
        const imgData = new FormData();
        imgData.append("file", formData.image);
        imgData.append("network", "public");

        const imgUpload = await fetch("https://uploads.pinata.cloud/v3/files", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${JWT}`,
          },
          body: imgData,
        });

        const imgRes = await imgUpload.json();
        console.log("Image upload response:", imgRes);

        imageCid = imgRes?.data?.cid || null;
      }

      // Step 2: Build JSON metadata including image CID
      const metadata = {
        name: formData.name,
        farmId: formData.farmId,
        location: formData.location,
        image: imageCid ? `ipfs://${imageCid}` : null,
      };

        // Generate unique filename: farmId + timestamp
      const fileName = `${formData.farmId}_${Date.now()}.json`;

      const blob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: "application/json",
      });
      const jsonFile = new File([blob], fileName, {
        type: "application/json",
      });

      const jsonData = new FormData();
      jsonData.append("file", jsonFile);
      jsonData.append("network", "public");

      // Step 3: Upload JSON to IPFS
      const request = await fetch("https://uploads.pinata.cloud/v3/files", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${JWT}`,
        },
        body: jsonData,
      });

      const response = await request.json();
      console.log("Metadata upload response:", response);
      alert(`Metadata uploaded! CID: ${response?.data?.cid}`);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  return (
    <>
    <div>
      <h3>Farm Data Upload</h3>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          uploadToIPFS();
        }}
      >
        <div>
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Farm ID:</label>
          <input
            type="text"
            name="farmId"
            value={formData.farmId}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Location:</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Image:</label>
          <input type="file" onChange={handleFileChange} />
        </div>

        <button type="submit">Upload to IPFS</button>
      </form>
    </div>
    </>
  );
}

export default FileUpload;
