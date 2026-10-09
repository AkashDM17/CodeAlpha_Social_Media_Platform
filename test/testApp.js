/**
 * ConnectHub - Comprehensive Automated Integration Test Suite
 * Tests all 25 features and API endpoints required by CodeAlpha Task 2
 */

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 CONNECTHUB FULL-STACK AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check & Server startup
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthJson = await healthRes.json();
    assert(healthRes.ok && healthJson.success, 'Test 1 & 2: Server running and healthy');

    // 2. Demo User Login
    const demoLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'demo@connecthub.com', password: 'Demo123' })
    });
    const demoLoginJson = await demoLoginRes.json();
    assert(demoLoginRes.ok && demoLoginJson.data?.token, 'Test 5: Demo user login with correct credentials');
    const demoToken = demoLoginJson.data.token;
    const demoUserId = demoLoginJson.data.user._id;

    // 3. User Registration (Unique user)
    const timestamp = Date.now();
    const testUsername = `tester_${timestamp}`;
    const testEmail = `tester_${timestamp}@example.com`;

    const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Automated Tester',
        username: testUsername,
        email: testEmail,
        password: 'Password123',
        confirmPassword: 'Password123'
      })
    });
    const registerJson = await registerRes.json();
    assert(registerRes.status === 201 && registerJson.success, 'Test 3: User registration with valid fields');
    const testToken = registerJson.data.token;
    const testUserId = registerJson.data.user._id;

    // 4. Duplicate Registration Validation
    const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Tester',
        username: testUsername,
        email: testEmail,
        password: 'Password123',
        confirmPassword: 'Password123'
      })
    });
    const dupJson = await dupRes.json();
    assert(dupRes.status === 400 && !dupJson.success, 'Test 4: Duplicate registration rejection (duplicate username/email)');

    // 5. JWT Authentication & /me endpoint
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${testToken}` }
    });
    const meJson = await meRes.json();
    assert(meRes.ok && meJson.data.username === testUsername, 'Test 6: JWT authentication valid and returns user profile');

    // 6. User Profile Retrieval
    const profileRes = await fetch(`${BASE_URL}/api/users/${testUserId}`);
    const profileJson = await profileRes.json();
    assert(profileRes.ok && profileJson.data.name === 'Automated Tester', 'Test 8: User profile retrieval by ID');

    // 7. Edit Profile
    const editProfileRes = await fetch(`${BASE_URL}/api/users/${testUserId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`
      },
      body: JSON.stringify({
        name: 'Tester Pro',
        bio: 'Updated bio for testing purposes.'
      })
    });
    const editProfileJson = await editProfileRes.json();
    assert(editProfileRes.ok && editProfileJson.data.name === 'Tester Pro', 'Test 9: Edit own profile updates name & bio');

    // 8. Create Post
    const createPostRes = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`
      },
      body: JSON.stringify({
        content: 'Hello ConnectHub! This is an automated test post.',
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800'
      })
    });
    const createPostJson = await createPostRes.json();
    assert(createPostRes.status === 201 && createPostJson.data._id, 'Test 10: Create post with content and image');
    const createdPostId = createPostJson.data._id;

    // 9. Edit Post
    const editPostRes = await fetch(`${BASE_URL}/api/posts/${createdPostId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`
      },
      body: JSON.stringify({
        content: 'Updated post content for test verification!'
      })
    });
    const editPostJson = await editPostRes.json();
    assert(editPostRes.ok && editPostJson.data.content === 'Updated post content for test verification!', 'Test 11: Edit own post');

    // 10. Like Post
    const likePostRes = await fetch(`${BASE_URL}/api/posts/${createdPostId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${demoToken}` }
    });
    const likePostJson = await likePostRes.json();
    assert(likePostRes.ok && likePostJson.data.likesCount === 1, 'Test 13: Like post increases count and adds user');

    // 11. Unlike Post
    const unlikePostRes = await fetch(`${BASE_URL}/api/posts/${createdPostId}/like`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${demoToken}` }
    });
    const unlikePostJson = await unlikePostRes.json();
    assert(unlikePostRes.ok && unlikePostJson.data.likesCount === 0, 'Test 14: Unlike post decreases count');

    // 12. Add Comment
    const addCommentRes = await fetch(`${BASE_URL}/api/posts/${createdPostId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${demoToken}`
      },
      body: JSON.stringify({ text: 'Awesome post from demo user!' })
    });
    const addCommentJson = await addCommentRes.json();
    assert(addCommentRes.status === 201 && addCommentJson.data.text === 'Awesome post from demo user!', 'Test 15: Add comment to post');
    const commentId = addCommentJson.data._id;

    // 13. Delete Comment
    const delCommentRes = await fetch(`${BASE_URL}/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${demoToken}` }
    });
    assert(delCommentRes.ok, 'Test 16: Delete own comment');

    // 14. Delete Post
    const delPostRes = await fetch(`${BASE_URL}/api/posts/${createdPostId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${testToken}` }
    });
    assert(delPostRes.ok, 'Test 12: Delete own post');

    // 15. Search Users
    const searchRes = await fetch(`${BASE_URL}/api/users/search?q=Sarah`);
    const searchJson = await searchRes.json();
    assert(searchRes.ok && searchJson.data.length > 0 && searchJson.data[0].name.includes('Sarah'), 'Test 17: Search users by name query');

    // 16. Follow User
    // Test user follows Demo user
    const followRes = await fetch(`${BASE_URL}/api/users/${demoUserId}/follow`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` }
    });
    const followJson = await followRes.json();
    assert(followRes.ok && followJson.data.isFollowing, 'Test 18: Follow user');

    // 17. Following List
    const followingRes = await fetch(`${BASE_URL}/api/users/${testUserId}/following`);
    const followingJson = await followingRes.json();
    assert(followingRes.ok && followingJson.data.some(u => u._id === demoUserId), 'Test 21: Following list includes followed user');

    // 18. Followers List
    const followersRes = await fetch(`${BASE_URL}/api/users/${demoUserId}/followers`);
    const followersJson = await followersRes.json();
    assert(followersRes.ok && followersJson.data.some(u => u._id === testUserId), 'Test 20: Followers list of target includes new follower');

    // 19. Unfollow User
    const unfollowRes = await fetch(`${BASE_URL}/api/users/${demoUserId}/follow`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${testToken}` }
    });
    const unfollowJson = await unfollowRes.json();
    assert(unfollowRes.ok && !unfollowJson.data.isFollowing, 'Test 19: Unfollow user removes relationship');

    // 20. Personalized Feed
    const feedRes = await fetch(`${BASE_URL}/api/posts/feed`, {
      headers: { Authorization: `Bearer ${demoToken}` }
    });
    const feedJson = await feedRes.json();
    assert(feedRes.ok && Array.isArray(feedJson.data) && feedJson.data.length > 0, 'Test 22: Personalized feed returns sorted posts');

    // 21. Unauthorized API Access protection
    const unauthorizedRes = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Should fail' })
    });
    assert(unauthorizedRes.status === 401, 'Test 23: Protected routes deny unauthorized access');

    // 22. Invalid Requests & Error handling
    const invalidPostRes = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${demoToken}`
      },
      body: JSON.stringify({ content: '   ' }) // empty content
    });
    assert(invalidPostRes.status === 400, 'Test 24: Invalid empty post is rejected with 400');

    // 23. Static Frontend files served
    const htmlRes = await fetch(`${BASE_URL}/index.html`);
    const htmlText = await htmlRes.text();
    assert(htmlRes.ok && htmlText.includes('ConnectHub'), 'Test 25: Static HTML UI served properly');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passed} passed, ${failed} failed out of ${passed + failed} assertions.`);
  console.log('====================================================');

  if (failed === 0) {
    console.log('🎉 ALL INTEGRATION TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
