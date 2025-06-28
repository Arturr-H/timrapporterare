export interface Repository {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    organization?: string;
}

export interface PullRequest {
    id: number;
    number: number;
    title: string;
    user: {
        login: string;
    };
    html_url: string;
    created_at: string;
}

export interface Commit {
    sha: string;
    message: string;
    author: string;
    date: string;
    url: string;
}

export interface PRCommitsData {
    pull_title: string;
    repo_name: string;
    pull_url: string;
    commits: Commit[];
}

export interface AsanaTask {
    gid: string;
    name: string;
    due_on?: string;
    permalink_url: string;
}
