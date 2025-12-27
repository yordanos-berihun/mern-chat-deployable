// PostsPage.jsx
import { useEffect, useState } from "react";
import { api } from "./apiClient";

function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  // Load posts on mount
  useEffect(() => {
    api
      .get("/posts")
      .then(setPosts)
      .catch((err) => setError(err.message));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const newPost = await api.post("/posts", { title, content });
      setPosts((prev) => [newPost, ...prev]);
      setTitle("");
      setContent("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Your Posts</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleCreate}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button type="submit">Create Post</button>
      </form>

      <ul>
        {posts.map((p) => (
          <li key={p._id}>
            <strong>{p.title}</strong> – {p.content}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PostsPage;
