# Update JWT Secret in backend/.env

## ✅ Generated JWT Secret

Your secure JWT secret has been generated:

```
80944a16cbda1804c37c4190b350aa484814dcd3ab22ace18148873bf5987ad9
```

## 📝 Update Instructions

1. **Open** `backend/.env` file

2. **Find** the line with `JWT_SECRET`:
   ```
   JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
   ```

3. **Replace** it with:
   ```
   JWT_SECRET=80944a16cbda1804c37c4190b350aa484814dcd3ab22ace18148873bf5987ad9
   ```

4. **Save** the file

## ✅ Verification

After updating, your `backend/.env` should have:
- ✅ `JWT_SECRET` set to the generated value above
- ✅ `MONGODB_URI` configured
- ✅ `CORS_ORIGIN` set to `http://localhost:3000`

## 🎯 Next Step

Once the JWT_SECRET is updated, proceed to **Step 2: Install Dependencies**

```bash
npm run install:all
```

---

**JWT Secret Generated! Update your backend/.env file.** ✅


