from services.index_manager import rebuild_index

if __name__ == "__main__":
    print("Rebuilding search index...")
    if rebuild_index():
        print("Search index rebuilt successfully!")
    else:
        print("Failed to rebuild search index. Check the logs for details.") 