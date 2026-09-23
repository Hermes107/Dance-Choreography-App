import { Router, type IRouter } from "express";
import { and, asc, desc, eq, gte, gt, max, sql } from "drizzle-orm";
import {
  CreateDancerBody,
  CreateDancerParams,
  CreateDancerResponse,
  CreateKeyframeBody,
  CreateKeyframeParams,
  CreateKeyframeResponse,
  CreateProjectBody,
  CreateProjectResponse,
  DeleteDancerParams,
  DeleteKeyframeParams,
  DuplicateKeyframeParams,
  DuplicateKeyframeResponse,
  GetProjectParams,
  GetProjectResponse,
  ListProjectsResponse,
  ReorderKeyframesBody,
  ReorderKeyframesParams,
  ReorderKeyframesResponse,
  UpdateDancerBody,
  UpdateDancerParams,
  UpdateDancerResponse,
  UpdateKeyframeBody,
  UpdateKeyframeParams,
  UpdateKeyframeResponse,
  UpdateProjectBody,
  UpdateProjectParams,
  UpdateProjectResponse,
} from "@workspace/api-zod";
import {
  db,
  dancersTable,
  keyframesTable,
  projectsTable,
  type Position,
} from "@workspace/db";

const router: IRouter = Router();

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Invalid request";
}

async function seedStarterProject(): Promise<void> {
  const [project] = await db
    .insert(projectsTable)
    .values({
      name: "Neon Drift",
      description: "A starter formation board for your next routine.",
      stageWidth: 1200,
      stageHeight: 800,
      gridSize: 40,
    })
    .returning();

  const dancers = await db
    .insert(dancersTable)
    .values([
      {
        projectId: project.id,
        name: "Ari",
        initials: "AR",
        color: "#66E3C4",
        role: "Lead",
      },
      {
        projectId: project.id,
        name: "Bea",
        initials: "BE",
        color: "#FFB86B",
        role: "Support",
      },
      {
        projectId: project.id,
        name: "Cleo",
        initials: "CL",
        color: "#A993FF",
        role: "Support",
      },
      {
        projectId: project.id,
        name: "Dani",
        initials: "DA",
        color: "#FF7C9C",
        role: "Support",
      },
    ])
    .returning();

  const [opening, diagonal] = dancers;
  await db.insert(keyframesTable).values([
    {
      projectId: project.id,
      name: "Opening picture",
      sortOrder: 0,
      positions: [
        { dancerId: opening.id, x: 600, y: 432 },
        { dancerId: diagonal.id, x: 408, y: 496 },
        { dancerId: dancers[2].id, x: 792, y: 496 },
        { dancerId: dancers[3].id, x: 600, y: 608 },
      ],
    },
    {
      projectId: project.id,
      name: "Diagonal travel",
      sortOrder: 1,
      positions: [
        { dancerId: opening.id, x: 864, y: 272 },
        { dancerId: diagonal.id, x: 648, y: 384 },
        { dancerId: dancers[2].id, x: 408, y: 512 },
        { dancerId: dancers[3].id, x: 240, y: 624 },
      ],
    },
  ]);
}

router.get("/projects", async (req, res): Promise<void> => {
  let projects = await db
    .select()
    .from(projectsTable)
    .orderBy(desc(projectsTable.updatedAt));

  if (projects.length === 0) {
    await seedStarterProject();
    projects = await db
      .select()
      .from(projectsTable)
      .orderBy(desc(projectsTable.updatedAt));
    req.log.info("Seeded the first Stagecraft project");
  }

  res.json(ListProjectsResponse.parse(projects));
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db
    .insert(projectsTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description,
      stageWidth: parsed.data.stageWidth ?? 1200,
      stageHeight: parsed.data.stageHeight ?? 800,
      gridSize: parsed.data.gridSize ?? 40,
    })
    .returning();

  res.status(201).json(CreateProjectResponse.parse(project));
});

router.get("/projects/:projectId", async (req, res): Promise<void> => {
  const parsedParams = GetProjectParams.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.message });
    return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, parsedParams.data.projectId));

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [dancers, keyframes] = await Promise.all([
    db
      .select()
      .from(dancersTable)
      .where(eq(dancersTable.projectId, project.id))
      .orderBy(asc(dancersTable.createdAt)),
    db
      .select()
      .from(keyframesTable)
      .where(eq(keyframesTable.projectId, project.id))
      .orderBy(asc(keyframesTable.sortOrder)),
  ]);

  res.json(GetProjectResponse.parse({ project, dancers, keyframes }));
});

router.patch("/projects/:projectId", async (req, res): Promise<void> => {
  const parsedParams = UpdateProjectParams.safeParse(req.params);
  const parsedBody = UpdateProjectBody.safeParse(req.body);
  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.message });
    return;
  }
  if (!parsedBody.success) {
    res.status(400).json({ error: parsedBody.error.message });
    return;
  }

  const [project] = await db
    .update(projectsTable)
    .set(parsedBody.data)
    .where(eq(projectsTable.id, parsedParams.data.projectId))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.json(UpdateProjectResponse.parse(project));
});

router.post(
  "/projects/:projectId/dancers",
  async (req, res): Promise<void> => {
    const parsedParams = CreateDancerParams.safeParse(req.params);
    const parsedBody = CreateDancerBody.safeParse(req.body);
    if (!parsedParams.success) {
      res.status(400).json({ error: parsedParams.error.message });
      return;
    }
    if (!parsedBody.success) {
      res.status(400).json({ error: parsedBody.error.message });
      return;
    }

    const [project] = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(eq(projectsTable.id, parsedParams.data.projectId));
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const [dancer] = await db
      .insert(dancersTable)
      .values({
        projectId: parsedParams.data.projectId,
        ...parsedBody.data,
      })
      .returning();

    res.status(201).json(CreateDancerResponse.parse(dancer));
  },
);

router.patch("/dancers/:dancerId", async (req, res): Promise<void> => {
  const parsedParams = UpdateDancerParams.safeParse(req.params);
  const parsedBody = UpdateDancerBody.safeParse(req.body);
  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.message });
    return;
  }
  if (!parsedBody.success) {
    res.status(400).json({ error: parsedBody.error.message });
    return;
  }

  const [dancer] = await db
    .update(dancersTable)
    .set(parsedBody.data)
    .where(eq(dancersTable.id, parsedParams.data.dancerId))
    .returning();

  if (!dancer) {
    res.status(404).json({ error: "Dancer not found" });
    return;
  }

  res.json(UpdateDancerResponse.parse(dancer));
});

router.delete("/dancers/:dancerId", async (req, res): Promise<void> => {
  const parsedParams = DeleteDancerParams.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.message });
    return;
  }

  const deleted = await db.transaction(async (tx) => {
    const [dancer] = await tx
      .delete(dancersTable)
      .where(eq(dancersTable.id, parsedParams.data.dancerId))
      .returning();
    if (!dancer) return null;

    const keyframes = await tx
      .select()
      .from(keyframesTable)
      .where(eq(keyframesTable.projectId, dancer.projectId));
    for (const keyframe of keyframes) {
      await tx
        .update(keyframesTable)
        .set({
          positions: keyframe.positions.filter(
            (position) => position.dancerId !== dancer.id,
          ),
        })
        .where(eq(keyframesTable.id, keyframe.id));
    }
    return dancer;
  });

  if (!deleted) {
    res.status(404).json({ error: "Dancer not found" });
    return;
  }

  res.sendStatus(204);
});

router.post(
  "/projects/:projectId/keyframes",
  async (req, res): Promise<void> => {
    const parsedParams = CreateKeyframeParams.safeParse(req.params);
    const parsedBody = CreateKeyframeBody.safeParse(req.body);
    if (!parsedParams.success) {
      res.status(400).json({ error: parsedParams.error.message });
      return;
    }
    if (!parsedBody.success) {
      res.status(400).json({ error: parsedBody.error.message });
      return;
    }

    const [project] = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(eq(projectsTable.id, parsedParams.data.projectId));
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const [last] = await db
      .select({ sortOrder: max(keyframesTable.sortOrder) })
      .from(keyframesTable)
      .where(eq(keyframesTable.projectId, project.id));

    const [keyframe] = await db
      .insert(keyframesTable)
      .values({
        projectId: project.id,
        name: parsedBody.data.name,
        positions: parsedBody.data.positions as Position[],
        notes: parsedBody.data.notes,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      })
      .returning();

    res.status(201).json(CreateKeyframeResponse.parse(keyframe));
  },
);

router.patch("/keyframes/:keyframeId", async (req, res): Promise<void> => {
  const parsedParams = UpdateKeyframeParams.safeParse(req.params);
  const parsedBody = UpdateKeyframeBody.safeParse(req.body);
  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.message });
    return;
  }
  if (!parsedBody.success) {
    res.status(400).json({ error: parsedBody.error.message });
    return;
  }

  const [keyframe] = await db
    .update(keyframesTable)
    .set({
      ...parsedBody.data,
      positions: parsedBody.data.positions as Position[] | undefined,
    })
    .where(eq(keyframesTable.id, parsedParams.data.keyframeId))
    .returning();

  if (!keyframe) {
    res.status(404).json({ error: "Keyframe not found" });
    return;
  }

  res.json(UpdateKeyframeResponse.parse(keyframe));
});

router.delete("/keyframes/:keyframeId", async (req, res): Promise<void> => {
  const parsedParams = DeleteKeyframeParams.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.message });
    return;
  }

  const [keyframe] = await db
    .delete(keyframesTable)
    .where(eq(keyframesTable.id, parsedParams.data.keyframeId))
    .returning();

  if (!keyframe) {
    res.status(404).json({ error: "Keyframe not found" });
    return;
  }

  await db
    .update(keyframesTable)
    .set({ sortOrder: sql`${keyframesTable.sortOrder} - 1` })
    .where(
      and(
        eq(keyframesTable.projectId, keyframe.projectId),
        gt(keyframesTable.sortOrder, keyframe.sortOrder),
      ),
    );

  res.sendStatus(204);
});

router.post(
  "/keyframes/:keyframeId/duplicate",
  async (req, res): Promise<void> => {
    const parsedParams = DuplicateKeyframeParams.safeParse(req.params);
    if (!parsedParams.success) {
      res.status(400).json({ error: parsedParams.error.message });
      return;
    }

    const duplicate = await db.transaction(async (tx) => {
      const [source] = await tx
        .select()
        .from(keyframesTable)
        .where(eq(keyframesTable.id, parsedParams.data.keyframeId));
      if (!source) return null;

      await tx
        .update(keyframesTable)
        .set({ sortOrder: sql`${keyframesTable.sortOrder} + 1` })
        .where(
          and(
            eq(keyframesTable.projectId, source.projectId),
            gte(keyframesTable.sortOrder, source.sortOrder + 1),
          ),
        );

      const [created] = await tx
        .insert(keyframesTable)
        .values({
          projectId: source.projectId,
          name: `${source.name} copy`,
          sortOrder: source.sortOrder + 1,
          positions: source.positions,
          notes: source.notes,
        })
        .returning();
      return created;
    });

    if (!duplicate) {
      res.status(404).json({ error: "Keyframe not found" });
      return;
    }

    res.status(201).json(DuplicateKeyframeResponse.parse(duplicate));
  },
);

router.post(
  "/projects/:projectId/keyframes/reorder",
  async (req, res): Promise<void> => {
    const parsedParams = ReorderKeyframesParams.safeParse(req.params);
    const parsedBody = ReorderKeyframesBody.safeParse(req.body);
    if (!parsedParams.success) {
      res.status(400).json({ error: parsedParams.error.message });
      return;
    }
    if (!parsedBody.success) {
      res.status(400).json({ error: parsedBody.error.message });
      return;
    }

    const keyframes = await db
      .select()
      .from(keyframesTable)
      .where(eq(keyframesTable.projectId, parsedParams.data.projectId));
    const expected = new Set(keyframes.map((keyframe) => keyframe.id));
    const received = new Set(parsedBody.data.keyframeIds);
    if (
      expected.size !== received.size ||
      [...expected].some((id) => !received.has(id))
    ) {
      res.status(400).json({ error: "keyframeIds must include every project keyframe" });
      return;
    }

    await db.transaction(async (tx) => {
      for (const [sortOrder, id] of parsedBody.data.keyframeIds.entries()) {
        await tx
          .update(keyframesTable)
          .set({ sortOrder })
          .where(
            and(
              eq(keyframesTable.id, id),
              eq(keyframesTable.projectId, parsedParams.data.projectId),
            ),
          );
      }
    });

    const reordered = await db
      .select()
      .from(keyframesTable)
      .where(eq(keyframesTable.projectId, parsedParams.data.projectId))
      .orderBy(asc(keyframesTable.sortOrder));
    res.json(ReorderKeyframesResponse.parse(reordered));
  },
);

export default router;