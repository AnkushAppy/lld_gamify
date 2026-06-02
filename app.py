import uvicorn

if __name__ == "__main__":
    print("\n🚀 Starting LLD Speedrun API server...")
    print("👉 API docs: http://127.0.0.1:8000/docs")
    print("👉 Start frontend: cd frontend && npm run dev\n")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
