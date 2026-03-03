'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getStoredToken, api } from '@/lib/api';
import type { ForumPost, ForumComment } from '@/lib/api';

const CATEGORIES: { key: string; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'startup_help', label: 'Startup Help' },
  { key: 'funding', label: 'Funding' },
  { key: 'tech', label: 'Tech Support' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'founder_stories', label: 'Founder Stories' },
];

export default function CommunityPage() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState<string>('');
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [creating, setCreating] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [commenting, setCommenting] = useState(false);

  const token = getStoredToken();

  function loadPosts() {
    setLoading(true);
    api.forum
      .list({ category: category || undefined, search: search || undefined })
      .then((res) => {
        setPosts(res.items);
        if (selectedPost) {
          const fresh = res.items.find((p) => p.id === selectedPost.id) || null;
          setSelectedPost(fresh);
        }
      })
      .catch(() => setError('Failed to load community posts'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  async function openPost(post: ForumPost) {
    try {
      const full = await api.forum.get(post.id);
      setSelectedPost(full);
      setComments(full.comments ?? []);
    } catch {
      setSelectedPost(post);
      setComments([]);
    }
  }

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError('Please log in to post in the community.');
      return;
    }
    if (!title.trim() || !body.trim()) return;
    setCreating(true);
    setError('');
    try {
      const post = await api.forum.create(
        { title: title.trim(), content: body.trim(), category: category || 'startup_help' },
        token
      );
      setTitle('');
      setBody('');
      setPosts((prev) => [post, ...prev]);
    } catch (err) {
      setError((err as Error).message || 'Failed to create post');
    } finally {
      setCreating(false);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !selectedPost || !commentBody.trim()) return;
    setCommenting(true);
    setError('');
    try {
      const c = await api.forum.comment(selectedPost.id, commentBody.trim(), token);
      setComments((prev) => [...prev, c]);
      setCommentBody('');
    } catch (err) {
      setError((err as Error).message || 'Failed to comment');
    } finally {
      setCommenting(false);
    }
  }

  async function handleToggleLike(postId: string) {
    if (!token) {
      setError('Please log in to like posts.');
      return;
    }
    try {
      const res = await api.forum.toggleLike(postId, token);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likeCount: p.likeCount + (res.liked ? 1 : -1),
              }
            : p
        )
      );
      if (selectedPost?.id === postId) {
        setSelectedPost((prev) =>
          prev
            ? {
                ...prev,
                likeCount: prev.likeCount + (res.liked ? 1 : -1),
              }
            : prev
        );
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to update like');
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-secondary mb-2">Community Forum</h1>
          <p className="text-gray-600">
            Ask questions, share experiences, and learn from other founders, investors, and team members.
          </p>
        </div>
        <div className="flex-1 flex justify-end">
          <Image
            src="/Riseflow hub Q&A PICS.png"
            alt="Founders asking questions and learning together"
            width={380}
            height={240}
            className="w-full max-w-sm rounded-xl border border-secondary/10 bg-white object-cover shadow-sm shadow-secondary/10"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-amber-800 text-sm">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.key || 'all'}
            type="button"
            onClick={() => setCategory(c.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium border ${
              category === c.key ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200'
            }`}
          >
            {c.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics..."
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={loadPosts}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            Search
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <form onSubmit={handleCreatePost} className="rounded-xl border border-gray-200 bg-white p-5 space-y-3 lg:col-span-1">
          <h2 className="text-sm font-semibold text-secondary">Start a discussion</h2>
          {!token && (
            <p className="text-xs text-gray-500">
              Log in to post and reply. You can still browse existing discussions without an account.
            </p>
          )}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. How do I prepare for investors?)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            disabled={!token}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Share your question, story, or challenge..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            disabled={!token}
          />
          <button
            type="submit"
            disabled={!token || creating || !title.trim() || !body.trim()}
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {creating ? 'Posting...' : 'Post to community'}
          </button>
        </form>

        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-secondary mb-3">Latest posts</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Loading posts...</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-gray-500">No posts yet. Be the first to start a discussion.</p>
          ) : (
            <ul className="space-y-3">
              {posts.map((post) => (
                <li
                  key={post.id}
                  className="cursor-pointer rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 hover:border-primary/50"
                  onClick={() => openPost(post)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-text-dark line-clamp-1">{post.title}</h3>
                    <span className="text-[10px] uppercase tracking-wide text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600 line-clamp-2">{post.body}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-500">
                    <span>{post.user?.name ?? 'Anonymous'}</span>
                    <span>•</span>
                    <span>{post.commentCount} replies</span>
                    <button
                      type="button"
                      className="ml-auto inline-flex items-center gap-1 text-[11px] text-gray-600 hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLike(post.id);
                      }}
                    >
                      <span>👍</span>
                      <span>{post.likeCount}</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {selectedPost && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-primary mb-1">
                {CATEGORIES.find((c) => c.key === selectedPost.category)?.label || 'Discussion'}
              </p>
              <h2 className="text-lg font-semibold text-secondary">{selectedPost.title}</h2>
              <p className="text-xs text-gray-500 mt-1">
                {selectedPost.user?.name ?? 'Anonymous'} ·{' '}
                {new Date(selectedPost.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4">{selectedPost.body}</p>

          <div className="border-t border-gray-100 pt-4 mt-2">
            <h3 className="text-sm font-semibold text-secondary mb-2">Replies</h3>
            {comments.length === 0 ? (
              <p className="text-xs text-gray-500 mb-3">No replies yet. Start the conversation.</p>
            ) : (
              <ul className="space-y-2 mb-3">
                {comments.map((c) => (
                  <li key={c.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                    <p className="text-xs font-medium text-gray-800">
                      {c.user?.name ?? 'Anonymous'}{' '}
                      <span className="ml-1 text-[10px] text-gray-400">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-gray-700 whitespace-pre-wrap">{c.body}</p>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={handleAddComment} className="mt-2 space-y-2">
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder={token ? 'Write a reply...' : 'Log in to reply.'}
                disabled={!token}
              />
              <button
                type="submit"
                disabled={!token || commenting || !commentBody.trim()}
                className="inline-flex items-center rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {commenting ? 'Posting...' : 'Reply'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

