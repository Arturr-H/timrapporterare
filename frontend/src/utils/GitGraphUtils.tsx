import { GitCommit, PullRequest, BranchPoint, BranchLine, TimelineGraph } from '../Types';

interface ProcessedGraph {
    points: BranchPoint[];
    lines: BranchLine[];
}

// Original function for compatibility
export function processGitHistory(
    commits: GitCommit[],
    pullRequests: PullRequest[],
    defaultBranch: string
): ProcessedGraph {
    const points: BranchPoint[] = [];
    const lines: BranchLine[] = [];
    
    if (commits.length === 0) {
        return { points, lines };
    }

    // Sort commits by date (newest first)
    const sortedCommits = [...commits].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Simple visualization: main branch in center, PRs branch out
    const mainX = 150;
    const branchOffset = 100;
    const verticalSpacing = 60;
    const startY = 50;

    // Create points for each commit
    sortedCommits.forEach((commit, index) => {
        const y = startY + index * verticalSpacing;
        
        // Find if this commit is associated with a PR
        const associatedPR = pullRequests.find(pr => 
            pr.merge_commit_sha === commit.sha ||
            commit.message.toLowerCase().includes(`merge pull request #${pr.number}`) ||
            commit.message.includes(`(#${pr.number})`)
        );

        // Determine position
        let x = mainX;
        let isMainBranch = true;
        
        // If it's a merge commit for a PR, place it on main branch
        if (associatedPR && commit.parents.length > 1) {
            x = mainX;
            isMainBranch = true;
        }
        // If it's part of a PR but not the merge, offset it
        else if (commit.message.includes('Merge') || commit.parents.length > 1) {
            x = mainX;
            isMainBranch = true;
        }
        // Regular commits on feature branches
        else if (index % 3 !== 0) { // Simple heuristic: some commits are on branches
            x = mainX + branchOffset;
            isMainBranch = false;
        }

        const point: BranchPoint = {
            id: commit.sha,
            x,
            y,
            commit,
            isMainBranch,
            isPR: !!associatedPR,
            prNumber: associatedPR?.number,
            branchName: associatedPR?.head?.ref
        };

        points.push(point);
    });

    // Create lines between points
    for (let i = 0; i < points.length - 1; i++) {
        const currentPoint = points[i];
        const nextPoint = points[i + 1];

        // Main branch continuous line
        if (currentPoint.isMainBranch && nextPoint.isMainBranch) {
            lines.push({
                from: currentPoint,
                to: nextPoint,
                type: 'straight'
            });
        }
        // Branch out
        else if (currentPoint.isMainBranch && !nextPoint.isMainBranch) {
            lines.push({
                from: currentPoint,
                to: nextPoint,
                type: 'branch'
            });
        }
        // Merge back
        else if (!currentPoint.isMainBranch && nextPoint.isMainBranch) {
            lines.push({
                from: currentPoint,
                to: nextPoint,
                type: 'merge'
            });
        }
        // Continue on branch
        else {
            lines.push({
                from: currentPoint,
                to: nextPoint,
                type: 'straight'
            });
        }
    }

    // Add main branch indicator at the top
    if (points.length > 0) {
        const mainBranchPoint: BranchPoint = {
            id: 'main-branch-indicator',
            x: mainX,
            y: 20,
            commit: {
                sha: 'main',
                message: `${defaultBranch} branch`,
                author: 'System',
                date: new Date().toISOString(),
                parents: [],
                html_url: ''
            },
            isMainBranch: true,
            branchName: defaultBranch
        };
        
        points.unshift(mainBranchPoint);
        
        if (points.length > 1) {
            lines.unshift({
                from: mainBranchPoint,
                to: points[1],
                type: 'straight'
            });
        }
    }

    return { points, lines };
}

// Timeline-based visualization
export function processGitHistoryTimeline(
    commits: GitCommit[],
    pullRequests: PullRequest[],
    defaultBranch: string,
    dateRange: { start: Date; end: Date }
): TimelineGraph {
    const points: BranchPoint[] = [];
    const lines: BranchLine[] = [];
    const timeLabels: { y: number; text: string }[] = [];
    
    if (commits.length === 0) {
        return { points, lines, timeLabels };
    }

    // Constants for layout
    const mainX = 50;  // main branch position
    const devX = 150;  // dev branch position
    const branchOffsetStart = 250; // where feature branches start
    const branchSpacing = 60; // space between feature branches
    const pixelsPerDay = 100;
    const topPadding = 40;

    // Helper to convert date to Y position
    const dateToY = (date: Date): number => {
        const daysDiff = (date.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
        return topPadding + daysDiff * pixelsPerDay;
    };

    // Create time labels
    const currentDate = new Date(dateRange.start);
    while (currentDate <= dateRange.end) {
        const y = dateToY(currentDate);
        timeLabels.push({
            y,
            text: currentDate.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Track active branches and their positions
    const activeBranches = new Map<string, { x: number; startY: number; commits: GitCommit[] }>();
    let nextBranchPosition = 0;

    // Filter commits within date range
    const relevantCommits = commits.filter(commit => {
        const commitDate = new Date(commit.date);
        return commitDate >= dateRange.start && commitDate <= dateRange.end;
    });

    // Sort commits by date (oldest first for processing)
    const sortedCommits = [...relevantCommits].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Group commits by PR/branch
    const prCommits = new Map<number, GitCommit[]>();
    const branchCommits = new Map<string, GitCommit[]>();
    
    sortedCommits.forEach(commit => {
        // Find associated PR
        const pr = pullRequests.find(pr => 
            pr.merge_commit_sha === commit.sha ||
            commit.message.toLowerCase().includes(`merge pull request #${pr.number}`) ||
            commit.message.includes(`(#${pr.number})`)
        );

        if (pr) {
            if (!prCommits.has(pr.number)) {
                prCommits.set(pr.number, []);
            }
            prCommits.get(pr.number)!.push(commit);
        } else {
            // Try to extract branch name from commit message
            const branchMatch = commit.message.match(/\b(?:from|branch|feature|fix)\/([^\s]+)/i);
            const branchName = branchMatch ? branchMatch[1] : `branch-${commit.sha.substring(0, 7)}`;
            
            if (!branchCommits.has(branchName)) {
                branchCommits.set(branchName, []);
            }
            branchCommits.get(branchName)!.push(commit);
        }
    });

    // Create main and dev branch lines
    const mainStartY = dateToY(dateRange.start);
    const mainEndY = dateToY(dateRange.end);
    
    // Main branch line
    lines.push({
        from: { id: 'main-start', x: mainX, y: mainStartY, commit: {} as GitCommit, branchName: 'main', isMainBranch: true },
        to: { id: 'main-end', x: mainX, y: mainEndY, commit: {} as GitCommit, branchName: 'main', isMainBranch: true },
        type: 'straight'
    });

    // Dev branch line
    lines.push({
        from: { id: 'dev-start', x: devX, y: mainStartY, commit: {} as GitCommit, branchName: defaultBranch, isMainBranch: true },
        to: { id: 'dev-end', x: devX, y: mainEndY, commit: {} as GitCommit, branchName: defaultBranch, isMainBranch: true },
        type: 'straight'
    });

    // Process each PR as a branch
    prCommits.forEach((commits, prNumber) => {
        const pr = pullRequests.find(p => p.number === prNumber);
        if (!pr) return;

        // Find branch start (earliest commit) and end (merge)
        const branchStart = new Date(Math.min(...commits.map(c => new Date(c.date).getTime())));
        const branchEnd = pr.merged_at ? new Date(pr.merged_at) : new Date();
        
        // Skip if branch is outside date range
        if (branchEnd < dateRange.start || branchStart > dateRange.end) {
            return;
        }

        // Assign branch position
        const branchX = branchOffsetStart + (nextBranchPosition * branchSpacing);
        nextBranchPosition++;

        const startY = dateToY(branchStart);
        const endY = dateToY(branchEnd);

        // Create branch out point
        const branchOutPoint: BranchPoint = {
            id: `branch-out-${prNumber}`,
            x: devX,
            y: startY,
            commit: commits[0],
            branchName: pr.head?.ref || `PR-${prNumber}`,
            isMainBranch: false
        };
        points.push(branchOutPoint);

        // Create branch start point
        const branchStartPoint: BranchPoint = {
            id: `branch-start-${prNumber}`,
            x: branchX,
            y: startY + 20,
            commit: commits[0],
            branchName: pr.head?.ref || `PR-${prNumber}`,
            isMainBranch: false
        };
        points.push(branchStartPoint);

        // Branch out line
        lines.push({
            from: branchOutPoint,
            to: branchStartPoint,
            type: 'branch'
        });

        // Add commit points on the branch
        commits.forEach((commit, idx) => {
            const commitY = dateToY(new Date(commit.date));
            const commitPoint: BranchPoint = {
                id: commit.sha,
                x: branchX,
                y: commitY,
                commit,
                branchName: pr.head?.ref || `PR-${prNumber}`,
                isMainBranch: false,
                isPR: false
            };
            points.push(commitPoint);

            // Connect commits on branch
            if (idx === 0) {
                lines.push({
                    from: branchStartPoint,
                    to: commitPoint,
                    type: 'straight'
                });
            }
        });

        // Branch line
        if (commits.length > 1) {
            lines.push({
                from: {
                    id: `branch-line-start-${prNumber}`,
                    x: branchX,
                    y: dateToY(new Date(commits[0].date)),
                    commit: {} as GitCommit,
                    branchName: pr.head?.ref || `PR-${prNumber}`,
                    isMainBranch: false
                },
                to: {
                    id: `branch-line-end-${prNumber}`,
                    x: branchX,
                    y: endY - 20,
                    commit: {} as GitCommit,
                    branchName: pr.head?.ref || `PR-${prNumber}`,
                    isMainBranch: false
                },
                type: 'straight'
            });
        }

        // Merge back point (if merged)
        if (pr.merged_at) {
            const mergePoint: BranchPoint = {
                id: `merge-${prNumber}`,
                x: devX,
                y: endY,
                commit: commits[commits.length - 1],
                branchName: defaultBranch,
                isMainBranch: true,
                isPR: true,
                prNumber
            };
            points.push(mergePoint);

            // Merge line
            lines.push({
                from: {
                    id: `branch-merge-start-${prNumber}`,
                    x: branchX,
                    y: endY - 20,
                    commit: {} as GitCommit,
                    branchName: pr.head?.ref || `PR-${prNumber}`,
                    isMainBranch: false
                },
                to: mergePoint,
                type: 'merge'
            });
        }

        // Reset position counter if it gets too wide
        if (nextBranchPosition > 3) {
            nextBranchPosition = 0;
        }
    });

    // Add some dev->main merges for visualization
    const weeklyMerges = [];
    const current = new Date(dateRange.start);
    while (current <= dateRange.end) {
        if (current.getDay() === 1) { // Monday merges
            const mergeY = dateToY(current);
            const mergePoint: BranchPoint = {
                id: `dev-main-merge-${current.getTime()}`,
                x: mainX,
                y: mergeY,
                commit: {
                    sha: `merge-${current.getTime()}`,
                    message: 'Weekly merge to main',
                    author: 'System',
                    date: current.toISOString(),
                    parents: [],
                    html_url: ''
                },
                branchName: 'main',
                isMainBranch: true
            };
            points.push(mergePoint);

            // Dev to main merge line
            lines.push({
                from: {
                    id: `dev-point-${current.getTime()}`,
                    x: devX,
                    y: mergeY,
                    commit: {} as GitCommit,
                    branchName: defaultBranch,
                    isMainBranch: true
                },
                to: mergePoint,
                type: 'merge'
            });
        }
        current.setDate(current.getDate() + 1);
    }

    return { points, lines, timeLabels };
}
