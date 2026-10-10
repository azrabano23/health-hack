from recommend.rank import fit_score, haversine_km, load_weights, rank

W = load_weights()
RS = [
    {"id": "gym-near", "name": "Near gym", "dimensions": ["physical"], "campus": "nb", "lat": 40.5010, "lng": -74.4470},
    {"id": "caps", "name": "CAPS", "dimensions": ["emotional"], "campus": "nb", "lat": 40.4976, "lng": -74.4475, "crisis": True},
    {"id": "basic-needs", "name": "Basic Needs", "dimensions": ["financial"], "campus": "nb", "lat": 40.5030, "lng": -74.4517},
    {"id": "peer", "name": "Peer support", "dimensions": ["emotional", "social"], "campus": "nb", "lat": None, "lng": None, "online": True},
    {"id": "nwk-caps", "name": "Newark CAPS", "dimensions": ["emotional"], "campus": "nwk", "lat": 40.7424, "lng": -74.1738, "crisis": True},
]


def test_haversine_sanity():
    assert abs(haversine_km((40.5008, -74.4474), (40.5008, -74.4474))) < 1e-9
    assert 2.0 < haversine_km((40.5008, -74.4474), (40.5222, -74.4592)) < 3.0


def test_fit_beats_distance():
    # the nearest place is a gym; emotional low should put CAPS first even though it is farther
    out = rank("emotional", "nb", lat=40.5010, lng=-74.4470, resources=RS, weights=W)
    assert out[0]["id"] in ("caps", "peer")
    assert all(o["campus"] == "nb" for o in out)
    assert fit_score(RS[1], "emotional", "nb", W) > fit_score(RS[0], "emotional", "nb", W)


def test_online_resource_counts_as_reachable():
    out = rank("social", "nb", resources=RS, weights=W)
    assert out[0]["id"] == "peer" and out[0]["distance_km"] == 0.0 and out[0]["online"]


def test_real_registry_ranks_for_every_dimension():
    for d in ("physical", "emotional", "financial", "intellectual", "social", "spiritual", "occupational", "environmental"):
        out = rank(d, "nb", limit=3)
        assert out and d in out[0]["dimensions"], d

